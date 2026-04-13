import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/client";

export default function PublicReportPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/reports/public/${token}`)
      .then((response) => setData(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || "Report not available"));
  }, [token]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-white/70">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-white/70">
        Loading public report...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="panel w-full max-w-3xl p-8">
        <div className="text-xs uppercase tracking-[0.24em] text-teal-500">{data.branding?.companyName || "Shared report"}</div>
        <h1 className="mt-3 font-display text-4xl text-sand-50">{data.report.storage?.fileName || "Inspection report"}</h1>
        <p className="mt-3 text-sm text-white/60">This link remains active until the share token expires or is revoked.</p>
        <a href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/reports/public/${token}/download`} className="button-primary mt-8">
          Download report
        </a>
      </div>
    </div>
  );
}

