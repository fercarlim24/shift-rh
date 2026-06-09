const press =
  "ui-press transition-[transform,box-shadow,background-color,border-color,color] duration-[var(--duration-ui)] ease-[var(--ease-out)]";

export const inputClass = `w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2.5 text-sm text-[var(--foreground)] shadow-[var(--shadow-sm)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 ${press}`;

export const labelClass = "mb-1.5 block text-sm font-medium text-[var(--foreground)]";

export const btnPrimary = `inline-flex items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-accent)] ${press} hover:bg-[var(--accent-hover)]`;

export const btnSecondary = `inline-flex items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-sm)] ${press} hover:bg-[var(--background)]`;

export const btnDanger = `inline-flex items-center justify-center rounded-[var(--radius)] border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ${press} hover:bg-red-100`;

export const btnDangerSolid = `inline-flex items-center justify-center rounded-[var(--radius)] bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] ${press} hover:bg-red-700`;

export const btnLink =
  "ui-link-lift text-sm font-medium text-[var(--accent)] hover:underline";

export const cardClass = "ui-card";

export const formPanelClass = `max-w-xl space-y-4 ui-card p-6`;
