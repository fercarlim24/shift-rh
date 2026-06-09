import Link from "next/link";
import { btnPrimary, cardClass } from "@/lib/ui-classes";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className={`ui-reveal-in ${cardClass} border-dashed p-12 text-center`}>
      <p className="font-medium text-[var(--foreground)]">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--muted)]">
          {description}
        </p>
      ) : null}
      {actionHref && actionLabel ? (
        <Link href={actionHref} className={`${btnPrimary} mt-6`}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
