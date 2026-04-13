import { useEffect, useState } from "react";
import api from "../api/client";
import PageHeader from "../components/PageHeader";

const initialForm = {
  name: "",
  criteria: { minScore: 60, maxGuidePrice: 250000, minYieldPct: 7, postcodes: [] },
  channels: { email: true, inApp: true },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState(initialForm);

  const loadAlerts = () => {
    api.get("/alerts").then((response) => setAlerts(response.data.items));
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    await api.post("/alerts", {
      ...form,
      criteria: {
        ...form.criteria,
        postcodes: form.criteria.postcodes
          .join(",")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      },
    });
    setForm(initialForm);
    loadAlerts();
  };

  const removeAlert = async (id) => {
    await api.delete(`/alerts/${id}`);
    loadAlerts();
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Automation" title="Alert rules" description="Create daily or instant deal alerts based on score, yield, price, and postcode." />

      <div className="grid gap-6 xl:grid-cols-[1fr,1.2fr]">
        <form className="panel p-6" onSubmit={submit}>
          <h2 className="font-display text-2xl text-sand-50">New rule</h2>
          <div className="mt-5 space-y-4">
            <input className="field" placeholder="Rule name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="grid gap-4 md:grid-cols-3">
              <input className="field" type="number" placeholder="Min score" value={form.criteria.minScore} onChange={(e) => setForm({ ...form, criteria: { ...form.criteria, minScore: Number(e.target.value) } })} />
              <input className="field" type="number" placeholder="Max guide price" value={form.criteria.maxGuidePrice} onChange={(e) => setForm({ ...form, criteria: { ...form.criteria, maxGuidePrice: Number(e.target.value) } })} />
              <input className="field" type="number" placeholder="Min yield %" value={form.criteria.minYieldPct} onChange={(e) => setForm({ ...form, criteria: { ...form.criteria, minYieldPct: Number(e.target.value) } })} />
            </div>
            <input
              className="field"
              placeholder="Postcodes, comma separated"
              value={form.criteria.postcodes.join(",")}
              onChange={(e) =>
                setForm({
                  ...form,
                  criteria: { ...form.criteria, postcodes: e.target.value.split(",") },
                })
              }
            />
            <button type="submit" className="button-primary">
              Save alert
            </button>
          </div>
        </form>

        <div className="panel p-6">
          <h2 className="font-display text-2xl text-sand-50">Existing alerts</h2>
          <div className="mt-4 space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="panel-soft p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-sand-50">{alert.name}</div>
                    <div className="mt-2 text-sm text-white/60">
                      Score {alert.criteria?.minScore || 0}+ | Yield {alert.criteria?.minYieldPct || 0}%+ | Max {alert.criteria?.maxGuidePrice || 0}
                    </div>
                  </div>
                  <button type="button" className="button-secondary" onClick={() => removeAlert(alert.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {!alerts.length ? <div className="text-sm text-white/50">No alert rules yet.</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

