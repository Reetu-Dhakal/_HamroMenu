export default function EmptyState({
  icon: Icon,
  title,
  copy,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-clay-50 text-clay-500">
        <Icon size={30} strokeWidth={1.6} />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      {copy && <p className="mt-1.5 max-w-xs text-[14px] leading-relaxed text-ink-faint">{copy}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}