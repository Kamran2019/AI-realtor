export default function PageHeader({ eyebrow, title, description, actions = null }) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-500">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-display text-3xl text-sand-50">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-white/60">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

