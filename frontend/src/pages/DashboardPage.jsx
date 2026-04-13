import { useEffect, useState } from "react";
import api from "../api/client";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/dashboard/summary").then((response) => setData(response.data));
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="Command center"
        description="Track active deals, inspection output, report volume, and scraper activity from one account-scoped dashboard."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active Deals" value={data?.cards?.activeDeals ?? "-"} />
        <StatCard label="Inspections" value={data?.cards?.inspections ?? "-"} />
        <StatCard label="Reports" value={data?.cards?.reports ?? "-"} />
        <StatCard label="Alerts" value={data?.cards?.alerts ?? "-"} />
        <StatCard label="Unread" value={data?.cards?.unreadNotifications ?? "-"} />
      </div>

      <div className="panel p-6">
        <h2 className="font-display text-2xl text-sand-50">Recent scraper runs</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-white/70">
            <thead className="text-white/40">
              <tr>
                <th className="pb-3">Run</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Fetched</th>
                <th className="pb-3">Created</th>
                <th className="pb-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentScrapeRuns || []).map((run) => (
                <tr key={run.id} className="border-t border-white/10">
                  <td className="py-3">{new Date(run.createdAt).toLocaleString()}</td>
                  <td className="py-3">{run.status}</td>
                  <td className="py-3">{run.stats?.fetched ?? 0}</td>
                  <td className="py-3">{run.stats?.created ?? 0}</td>
                  <td className="py-3">{run.stats?.updated ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

