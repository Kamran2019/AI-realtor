export default function StatCard({ label, value, caption }) {
  return (
    <div className="panel p-5">
      <div className="text-xs uppercase tracking-[0.24em] text-white/45">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-sand-50">{value}</div>
      {caption ? <div className="mt-2 text-sm text-white/55">{caption}</div> : null}
    </div>
  );
}

