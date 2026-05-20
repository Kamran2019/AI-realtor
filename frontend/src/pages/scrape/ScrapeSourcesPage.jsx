import { useEffect, useMemo, useState } from "react";
import FormError from "../../components/ui/FormError.jsx";
import {
  createScrapeSource,
  listScrapeRuns,
  listScrapeSources,
  runScrapeSource,
  updateScrapeSource,
  updateScrapeSourceStatus
} from "../../services/scrapeApi.js";

const emptyForm = {
  baseUrl: "",
  cron: "0 9 * * *",
  isEnabled: true,
  key: "",
  name: "",
  timezone: "Europe/London"
};

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

const ScrapeSourcesPage = () => {
  const [sources, setSources] = useState([]);
  const [runs, setRuns] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [form, setForm] = useState(emptyForm);
  const [editingSourceId, setEditingSourceId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [runningSourceIds, setRunningSourceIds] = useState([]);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const queryParams = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit
    }),
    [pagination.limit, pagination.page]
  );

  const loadSources = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [sourcesResponse, runsResponse] = await Promise.all([
        listScrapeSources(queryParams),
        listScrapeRuns({ limit: 5, page: 1 })
      ]);

      setSources(sourcesResponse.data.data.sources);
      setPagination(sourcesResponse.data.data.pagination);
      setRuns(runsResponse.data.data.runs);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Scrape sources could not be loaded."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, [queryParams]);

  const handleInputChange = (event) => {
    const { checked, name, type, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value
    }));
    setStatusMessage("");
  };

  const resetForm = () => {
    setEditingSourceId("");
    setForm(emptyForm);
  };

  const startEditing = (source) => {
    setEditingSourceId(source.id);
    setForm({
      baseUrl: source.baseUrl,
      cron: source.cron,
      isEnabled: source.isEnabled,
      key: source.key,
      name: source.name,
      timezone: source.timezone
    });
    setError("");
    setStatusMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatusMessage("");
    setIsSaving(true);

    try {
      const payload = {
        ...form,
        key: form.key.trim().toLowerCase(),
        name: form.name.trim(),
        baseUrl: form.baseUrl.trim(),
        cron: form.cron.trim(),
        timezone: form.timezone.trim()
      };
      const response = editingSourceId
        ? await updateScrapeSource(editingSourceId, payload)
        : await createScrapeSource(payload);
      const savedSource = response.data.data.source;

      setSources((currentSources) => {
        if (!editingSourceId) {
          return [savedSource, ...currentSources];
        }

        return currentSources.map((source) => (source.id === savedSource.id ? savedSource : source));
      });
      setStatusMessage(editingSourceId ? "Source updated." : "Source created.");
      resetForm();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Scrape source could not be saved."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (source) => {
    setError("");
    setStatusMessage("");

    try {
      const response = await updateScrapeSourceStatus(source.id, {
        isEnabled: !source.isEnabled
      });
      const updatedSource = response.data.data.source;

      setSources((currentSources) =>
        currentSources.map((listedSource) =>
          listedSource.id === updatedSource.id ? updatedSource : listedSource
        )
      );
      setStatusMessage("Source status updated.");
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, "Source status could not be updated."));
    }
  };

  const handleRunSource = async (source) => {
    setError("");
    setStatusMessage("");
    setRunningSourceIds((currentIds) => [...currentIds, source.id]);

    try {
      const response = await runScrapeSource(source.id);
      const finishedRun = response.data.data.run;
      const [sourcesResponse, runsResponse] = await Promise.all([
        listScrapeSources(queryParams),
        listScrapeRuns({ limit: 5, page: 1 })
      ]);

      setSources(sourcesResponse.data.data.sources);
      setPagination(sourcesResponse.data.data.pagination);
      setRuns(runsResponse.data.data.runs);
      setStatusMessage(
        `Run ${finishedRun.status}: ${finishedRun.stats.created} created, ${finishedRun.stats.updated} updated.`
      );
    } catch (runError) {
      setError(getErrorMessage(runError, "Scrape source could not be run."));
    } finally {
      setRunningSourceIds((currentIds) => currentIds.filter((id) => id !== source.id));
    }
  };

  const goToPage = (page) => {
    setPagination((currentPagination) => ({
      ...currentPagination,
      page
    }));
  };

  return (
    <section className="scrape-page" aria-labelledby="scrape-title">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Scraping</p>
          <h1 id="scrape-title">Sources</h1>
          <p>Configure property source endpoints and schedules.</p>
        </div>
      </div>

      <div className="scrape-layout">
        <form className="source-form" onSubmit={handleSubmit}>
          <h2>{editingSourceId ? "Edit source" : "Create source"}</h2>
          <label>
            Key
            <input
              name="key"
              onChange={handleInputChange}
              placeholder="auction-house"
              value={form.key}
            />
          </label>
          <label>
            Name
            <input
              name="name"
              onChange={handleInputChange}
              placeholder="Auction House"
              value={form.name}
            />
          </label>
          <label>
            Base URL
            <input
              name="baseUrl"
              onChange={handleInputChange}
              placeholder="https://example.com/auctions"
              value={form.baseUrl}
            />
          </label>
          <label>
            Cron
            <input name="cron" onChange={handleInputChange} value={form.cron} />
          </label>
          <label>
            Timezone
            <input name="timezone" onChange={handleInputChange} value={form.timezone} />
          </label>
          <label className="checkbox-row">
            <input
              checked={form.isEnabled}
              name="isEnabled"
              onChange={handleInputChange}
              type="checkbox"
            />
            Enabled
          </label>
          <div className="form-actions">
            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : editingSourceId ? "Update" : "Create"}
            </button>
            {editingSourceId ? (
              <button className="secondary-button" onClick={resetForm} type="button">
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="source-list-panel">
          <FormError>{error}</FormError>
          {statusMessage ? <p className="form-success">{statusMessage}</p> : null}

          <div className="table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Schedule</th>
                  <th>Health</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5">Loading sources...</td>
                  </tr>
                ) : sources.length ? (
                  sources.map((source) => (
                    <tr key={source.id}>
                      <td>
                        <strong>{source.name}</strong>
                        <span className="table-subtext">{source.key}</span>
                        <span className="table-subtext">{source.baseUrl}</span>
                      </td>
                      <td>
                        {source.cron}
                        <span className="table-subtext">{source.timezone}</span>
                      </td>
                      <td>
                        {source.health?.lastStatus || "unknown"}
                        <span className="table-subtext">
                          {source.health?.lastError || "No recent errors"}
                        </span>
                      </td>
                      <td>{source.isEnabled ? "Enabled" : "Disabled"}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="text-button"
                            disabled={runningSourceIds.includes(source.id)}
                            onClick={() => handleRunSource(source)}
                            type="button"
                          >
                            {runningSourceIds.includes(source.id) ? "Running..." : "Run now"}
                          </button>
                          <button className="text-button" onClick={() => startEditing(source)} type="button">
                            Edit
                          </button>
                          <button
                            className={source.isEnabled ? "text-button danger" : "text-button"}
                            onClick={() => handleToggle(source)}
                            type="button"
                          >
                            {source.isEnabled ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No scrape sources configured.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar" aria-label="Pagination">
            <button
              className="secondary-button"
              disabled={pagination.page <= 1}
              onClick={() => goToPage(pagination.page - 1)}
              type="button"
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              className="secondary-button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => goToPage(pagination.page + 1)}
              type="button"
            >
              Next
            </button>
          </div>

          <section className="runs-panel" aria-labelledby="runs-title">
            <h2 id="runs-title">Recent runs</h2>
            {runs.length ? (
              <ul>
                {runs.map((run) => (
                  <li key={run.id}>
                    <div>
                      <strong>{run.sourceKey}</strong>
                      <span className="table-subtext">
                        {run.startedAt ? new Date(run.startedAt).toLocaleString() : "Queued"}
                      </span>
                    </div>
                    <span className={`run-status ${run.status}`}>{run.status}</span>
                    <span>
                      {run.stats.created} created, {run.stats.updated} updated, {run.stats.skipped} skipped,{" "}
                      {run.stats.failed} errors
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No scrape runs yet.</p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
};

export default ScrapeSourcesPage;
