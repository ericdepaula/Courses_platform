export function LoadingScreen({
  label,
}: {
  label?: string;
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex h-12 w-12 animate-spin items-center justify-center rounded-full border-2 border-white/10 border-t-[var(--brand-blue)]" />
        {label ? <p className="text-sm text-[var(--text-muted)]">{label}</p> : null}
      </div>
    </div>
  );
}

export function LoadingBlock({
  label,
}: {
  label?: string;
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center justify-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[var(--brand-blue)]" />
        {label ? <span className="text-sm text-[var(--text-muted)]">{label}</span> : null}
      </div>
    </div>
  );
}
