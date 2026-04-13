import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [shareMessage, setShareMessage] = useState("");

  const loadReports = () => {
    api.get("/reports").then((response) => setReports(response.data.items));
  };

  useEffect(() => {
    loadReports();
  }, []);

  const enableShare = async (id) => {
    const { data } = await api.post(`/reports/${id}/share-enable`, { expiresInHours: 168 });
    setShareMessage(data.shareUrl);
    loadReports();
  };

  const disableShare = async (id) => {
    await api.post(`/reports/${id}/share-disable`);
    loadReports();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Reports"
        title="Generated PDFs"
        description="Manage property and inspection reports, copy share links, and access exported files."
      />

      {shareMessage ? <div className="rounded-2xl bg-teal-500/15 px-4 py-3 text-sm text-teal-500">{shareMessage}</div> : null}

      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="panel p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-xl font-semibold text-sand-50">{report.kind} report</div>
                <div className="mt-2 text-sm text-white/55">{report.storage?.fileName || report.id}</div>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href={report.storage?.url} className="button-secondary">
                  Open PDF
                </a>
                <Link to={`/reports/${report.id}`} className="button-secondary">
                  View detail
                </Link>
                <button type="button" className="button-primary" onClick={() => enableShare(report.id)}>
                  Enable share
                </button>
                {report.shareEnabled ? (
                  <button type="button" className="button-secondary" onClick={() => disableShare(report.id)}>
                    Disable share
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

