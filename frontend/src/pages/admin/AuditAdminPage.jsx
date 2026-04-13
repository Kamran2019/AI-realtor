import { useEffect, useState } from "react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";

export default function AuditAdminPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get("/audit").then((response) => setLogs(response.data.items));
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="Audit logs" description="Review sensitive account activity such as user management, manual scrape triggers, and finalized inspections." />

      <div className="panel overflow-hidden">
        <table className="min-w-full text-left text-sm text-white/65">
          <thead className="bg-white/5 text-white/40">
            <tr>
              <th className="px-5 py-4">Action</th>
              <th className="px-5 py-4">Target</th>
              <th className="px-5 py-4">IP</th>
              <th className="px-5 py-4">Created</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-white/10">
                <td className="px-5 py-4">{log.action}</td>
                <td className="px-5 py-4">
                  {log.targetType} {log.targetId}
                </td>
                <td className="px-5 py-4">{log.ip || "N/A"}</td>
                <td className="px-5 py-4">{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

