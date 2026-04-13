import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/client";
import PageHeader from "../components/PageHeader";

export default function BillingPage() {
  const { user } = useSelector((state) => state.auth);
  const [summary, setSummary] = useState(null);

  const loadSummary = () => {
    api.get("/billing/summary").then((response) => setSummary(response.data));
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const checkout = async (plan, interval) => {
    const { data } = await api.post("/billing/checkout-session", { plan, interval });
    window.location.assign(data.url);
  };

  const portal = async () => {
    const { data } = await api.post("/billing/portal-link");
    window.location.assign(data.url);
  };

  const plans = Object.entries(summary?.plans || {});

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Subscription" title="Billing and plan limits" description="Manage monthly or yearly subscriptions through Stripe Checkout and the customer portal." />

      <div className="panel p-6">
        <div className="text-sm uppercase tracking-[0.24em] text-white/40">Current subscription</div>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <div className="font-display text-4xl text-sand-50">{summary?.subscription?.plan || "free"}</div>
          <div className="rounded-full bg-teal-500/15 px-4 py-2 text-sm text-teal-500">{summary?.subscription?.status || "free"}</div>
          {user?.role === "admin" ? (
            <button type="button" className="button-secondary" onClick={portal}>
              Open customer portal
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {plans.map(([key, plan]) => (
          <div key={key} className="panel p-6">
            <div className="text-xs uppercase tracking-[0.24em] text-white/40">{key}</div>
            <div className="mt-3 font-display text-3xl text-sand-50">{plan.label}</div>
            <div className="mt-4 space-y-2 text-sm text-white/60">
              {Object.entries(plan.features || {}).map(([featureKey, value]) => (
                <div key={featureKey}>
                  {featureKey}: {value === -1 ? "Unlimited" : value}
                </div>
              ))}
            </div>
            {key !== "free" && user?.role === "admin" ? (
              <div className="mt-6 flex gap-3">
                <button type="button" className="button-primary" onClick={() => checkout(key, "monthly")}>
                  Monthly
                </button>
                <button type="button" className="button-secondary" onClick={() => checkout(key, "yearly")}>
                  Yearly
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
