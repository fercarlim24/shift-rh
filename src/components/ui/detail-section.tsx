import { Card } from "@/components/app-shell";

export function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

export function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <div className="mt-1.5 text-sm text-[var(--foreground)]">{value}</div>
    </div>
  );
}

export function DetailCard({
  title,
  children,
  actions,
}: {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      {title || actions ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {title ? (
            <h3 className="font-semibold tracking-tight text-[var(--foreground)]">{title}</h3>
          ) : (
            <span />
          )}
          {actions}
        </div>
      ) : null}
      {children}
    </Card>
  );
}
