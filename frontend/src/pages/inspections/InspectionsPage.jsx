import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";

const initialForm = {
  propertyRef: {
    address: "",
    postcode: "",
    externalUrl: "",
  },
  client: {
    name: "",
    email: "",
    phone: "",
  },
};

export default function InspectionsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);

  const loadInspections = () => {
    api.get("/inspections").then((response) => setItems(response.data.items));
  };

  useEffect(() => {
    loadInspections();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    await api.post("/inspections", form);
    setForm(initialForm);
    loadInspections();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inspection Tool"
        title="Snagging and inspection workflows"
        description="Create mobile-first inspections, upload room photos, run AI defect detection, and generate branded PDFs."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr,1.25fr]">
        <form className="panel p-6" onSubmit={submit}>
          <h2 className="font-display text-2xl text-sand-50">Create inspection</h2>
          <div className="mt-5 space-y-4">
            <input className="field" placeholder="Property address" value={form.propertyRef.address} onChange={(e) => setForm({ ...form, propertyRef: { ...form.propertyRef, address: e.target.value } })} />
            <input className="field" placeholder="Postcode" value={form.propertyRef.postcode} onChange={(e) => setForm({ ...form, propertyRef: { ...form.propertyRef, postcode: e.target.value } })} />
            <input className="field" placeholder="Linked property URL (optional)" value={form.propertyRef.externalUrl} onChange={(e) => setForm({ ...form, propertyRef: { ...form.propertyRef, externalUrl: e.target.value } })} />
            <input className="field" placeholder="Client name" value={form.client.name} onChange={(e) => setForm({ ...form, client: { ...form.client, name: e.target.value } })} />
            <input className="field" placeholder="Client email" value={form.client.email} onChange={(e) => setForm({ ...form, client: { ...form.client, email: e.target.value } })} />
            <input className="field" placeholder="Client phone" value={form.client.phone} onChange={(e) => setForm({ ...form, client: { ...form.client, phone: e.target.value } })} />
            <button type="submit" className="button-primary">
              Start inspection
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {items.map((inspection) => (
            <Link key={inspection.id} to={`/inspections/${inspection.id}`} className="panel block p-5 transition hover:border-teal-500/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold text-sand-50">{inspection.propertyRef?.address || "Untitled inspection"}</div>
                  <div className="mt-2 text-sm text-white/55">{inspection.propertyRef?.postcode || "No postcode"} | {inspection.status}</div>
                </div>
                <div className="rounded-full bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/45">
                  {inspection.summary?.totalDefects || 0} findings
                </div>
              </div>
            </Link>
          ))}
          {!items.length ? <div className="text-sm text-white/50">No inspections yet.</div> : null}
        </div>
      </div>
    </div>
  );
}

