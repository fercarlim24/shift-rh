export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    neutral: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/80",
    success: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
    warning: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
    danger: "bg-red-50 text-red-800 ring-1 ring-red-200/80",
    info: "bg-[var(--accent-subtle)] text-[var(--accent)] ring-1 ring-[var(--accent)]/25",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
