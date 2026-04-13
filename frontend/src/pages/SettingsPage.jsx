import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/client";
import PageHeader from "../components/PageHeader";
import { setSession } from "../features/auth/authSlice";

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { user, account } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    timezone: "",
    locale: "",
    branding: {
      companyName: "",
      logoUrl: "",
      primaryColor: "#159a8b",
      footerText: "",
    },
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm({
      timezone: user?.settings?.timezone || "UTC",
      locale: user?.settings?.locale || "en-GB",
      branding: {
        companyName: user?.branding?.companyName || account?.branding?.companyName || "",
        logoUrl: user?.branding?.logoUrl || account?.branding?.logoUrl || "",
        primaryColor: user?.branding?.primaryColor || account?.branding?.primaryColor || "#159a8b",
        footerText: user?.branding?.footerText || account?.branding?.footerText || "",
      },
    });
  }, [account, user]);

  const submit = async (event) => {
    event.preventDefault();
    const { data } = await api.put("/users/me/settings", form);
    dispatch(
      setSession({
        user: data.user,
        account: data.user.role === "admin" ? data.user : account,
      })
    );
    setMessage("Settings updated");
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Profile" title="User settings and branding" description="Configure timezone, locale, and report branding used in exported PDFs and shared reports." />

      <form className="grid gap-6 xl:grid-cols-2" onSubmit={submit}>
        <div className="panel p-6">
          <h2 className="font-display text-2xl text-sand-50">Preferences</h2>
          <div className="mt-5 space-y-4">
            <input className="field" placeholder="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
            <input className="field" placeholder="Locale" value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })} />
          </div>
        </div>

        <div className="panel p-6">
          <h2 className="font-display text-2xl text-sand-50">Branding</h2>
          <div className="mt-5 space-y-4">
            <input className="field" placeholder="Company name" value={form.branding.companyName} onChange={(e) => setForm({ ...form, branding: { ...form.branding, companyName: e.target.value } })} />
            <input className="field" placeholder="Logo URL" value={form.branding.logoUrl} onChange={(e) => setForm({ ...form, branding: { ...form.branding, logoUrl: e.target.value } })} />
            <input className="field" placeholder="Primary color" value={form.branding.primaryColor} onChange={(e) => setForm({ ...form, branding: { ...form.branding, primaryColor: e.target.value } })} />
            <textarea className="field min-h-28" placeholder="Footer text" value={form.branding.footerText} onChange={(e) => setForm({ ...form, branding: { ...form.branding, footerText: e.target.value } })} />
          </div>
        </div>

        <div className="xl:col-span-2">
          {message ? <div className="mb-4 rounded-2xl bg-teal-500/15 px-4 py-3 text-sm text-teal-500">{message}</div> : null}
          <button type="submit" className="button-primary">
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}
