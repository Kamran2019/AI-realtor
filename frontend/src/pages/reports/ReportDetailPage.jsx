import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import { shortDate } from "../../utils/format";

export default function ReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.get(`/reports/${id}`).then((response) => setReport(response.data.report));
  }, [id]);

  if (!report) {
    return <div className="text-white/60">Loading report...</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Report Detail"
        title={report.storage?.fileName || "Report"}
        description={`${report.kind} | ${report.status}`}
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="panel p-6">
          <h2 className="font-display text-2xl text-sand-50">Metadata</h2>
          <div className="mt-4 space-y-3 text-sm text-white/65">
            <div>Status: {report.status}</div>
            <div>Created: {shortDate(report.createdAt)}</div>
            <div>Share enabled: {report.shareEnabled ? "Yes" : "No"}</div>
            <div>Expires: {shortDate(report.shareExpiresAt)}</div>
          </div>
        </div>
        <div className="panel p-6">
          <h2 className="font-display text-2xl text-sand-50">File access</h2>
          <a href={report.storage?.url} className="button-primary mt-5">
            Open PDF
          </a>
        </div>
      </div>
    </div>
  );
}

