import { useEffect, useState } from "react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";

const initialSource = {
  key: "source_one",
  baseUrl: "",
  scheduleCron: "0 */12 * * *",
  enabled: false,
};

export default function ScrapeAdminPage() {
  const [sources, setSources] = useState([]);
  const [runs, setRuns] = useState([]);
  const [form, setForm] = useState(initialSource);

  const loadData = async () => {
    const [sourcesResponse, runsResponse] = await Promise.all([
      api.get("/scrape/sources"),
      api.get("/scrape/runs"),
    ]);
    setSources(sourcesResponse.data.items);
    setRuns(runsResponse.data.items);
  };

  useEffect(() => {
    loadData();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    await api.post("/scrape/sources", form);
    setForm(initialSource);
    loadData();
  };

  const runSource = async (id) => {
    await api.post(`/scrape/sources/${id}/run`);
    loadData();
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="Scraper health and sources" description="Manage cron-backed scrape sources, inspect recent runs, and trigger collection manually." />

      <div className="grid gap-6 xl:grid-cols-[1fr,1.2fr]">
        <form className="panel p-6" onSubmit={submit}>
          <h2 className="font-display text-2xl text-sand-50">Add source</h2>
          <div className="mt-5 space-y-4">
            <select className="field" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })}>
              <option value="source_one">Source one</option>
              <option value="source_two">Source two</option>
              <option value="source_three">Source three</option>
            </select>
            <input className="field" placeholder="Base URL" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} />
            <input className="field" placeholder="Cron schedule" value={form.scheduleCron} onChange={(e) => setForm({ ...form, scheduleCron: e.target.value })} />
            <label className="flex items-center gap-3 text-sm text-white/65">
              <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
              Enable source
            </label>
            <button type="submit" className="button-primary">
              Save source
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="panel p-6">
            <h2 className="font-display text-2xl text-sand-50">Configured sources</h2>
            <div className="mt-4 space-y-3">
              {sources.map((source) => (
                <div key={source.id} className="panel-soft flex items-center justify-between gap-4 p-4">
                  <div>
                    <div className="font-semibold text-sand-50">{source.key}</div>
                    <div className="text-sm text-white/55">{source.baseUrl}</div>
                  </div>
                  <button type="button" className="button-secondary" onClick={() => runSource(source.id)}>
                    Run now
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="font-display text-2xl text-sand-50">Recent runs</h2>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              {runs.map((run) => (
                <div key={run.id} className="panel-soft px-4 py-3">
                  {run.status} | fetched {run.stats?.fetched || 0} | created {run.stats?.created || 0} | updated {run.stats?.updated || 0}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

