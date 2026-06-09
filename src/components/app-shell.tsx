import { logoutAction, switchOrganizationAction } from "@/app/actions/auth";
import { AppNav } from "@/components/app-nav";
import { OrgSelect } from "@/components/org-select";
import type { Session } from "@/lib/session";
import { roleLabel } from "@/lib/labels";
import { canViewAllOrganizations, navItemsForRole } from "@/lib/rbac";

type OrganizationOption = { id: string; name: string; tradeName: string | null };

function userInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppShell({
  session,
  organizations,
  activeOrganization,
  children,
}: {
  session: Session;
  organizations: OrganizationOption[];
  activeOrganization: OrganizationOption;
  children: React.ReactNode;
}) {
  const navItems = navItemsForRole(session.user.role);
  const showOrgSwitcher = canViewAllOrganizations(session.user.role);

  return (
    <div className="flex min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]">
      <aside className="sidebar-glow relative flex w-[268px] shrink-0 flex-col border-r border-[var(--sidebar-border)]">
        <div className="border-b border-[var(--sidebar-border)] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-gradient-to-br from-[var(--accent)] to-[var(--highlight)] text-sm font-bold text-white shadow-[var(--shadow-accent)]">
              S
              <span className="absolute -inset-0.5 -z-10 rounded-[var(--radius)] bg-[var(--accent)] opacity-30 blur-md" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-white">Shift RH</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                Fase 1.1
              </p>
            </div>
          </div>
        </div>

        <AppNav items={navItems.map(({ href, label }) => ({ href, label }))} />

        <div className="mt-auto border-t border-[var(--sidebar-border)] px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
            Multi-tenant
          </p>
          <p className="mt-1 text-xs text-zinc-500">Dados isolados por cliente</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface-raised)]/85 px-6 py-3.5 backdrop-blur-xl backdrop-saturate-150">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
                Cliente ativo
              </p>
              <p className="truncate text-lg font-semibold tracking-tight text-[var(--foreground)]">
                {activeOrganization.tradeName ?? activeOrganization.name}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {showOrgSwitcher && organizations.length > 1 ? (
                <form action={switchOrganizationAction} className="flex items-center gap-2">
                  <label htmlFor="organizationId" className="sr-only">
                    Trocar cliente
                  </label>
                  <OrgSelect
                    organizations={organizations}
                    defaultValue={session.activeOrganizationId}
                  />
                </form>
              ) : null}

              <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow-sm)]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-subtle)] to-white text-xs font-semibold text-[var(--accent)] ring-1 ring-[var(--accent)]/20">
                  {userInitials(session.user.name)}
                </div>
                <div className="text-sm leading-tight">
                  <p className="font-medium text-[var(--foreground)]">{session.user.name}</p>
                  <p className="text-xs text-[var(--muted)]">{roleLabel[session.user.role]}</p>
                </div>
              </div>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="ui-press rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                >
                  Sair
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="app-canvas flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1400px] p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-[var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="ui-stat-card ui-card p-5">
      <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

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

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`ui-card ${className}`}>{children}</div>;
}
