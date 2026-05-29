import Link from "next/link";
import { logoutAction, switchOrganizationAction } from "@/app/actions";
import { OrgSelect } from "@/components/org-select";
import type { Session } from "@/lib/session";
import { roleLabel } from "@/lib/labels";

type OrganizationOption = { id: string; name: string; tradeName: string | null };

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "◉" },
  { href: "/clientes", label: "Clientes", icon: "◎" },
  { href: "/vagas", label: "Vagas", icon: "▣" },
  { href: "/recrutamento", label: "R&S", icon: "▤" },
  { href: "/tarefas", label: "Tarefas", icon: "☑" },
  { href: "/admissoes", label: "Admissões", icon: "✎" },
];

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
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Shift RH
          </p>
          <h1 className="mt-1 text-lg font-bold text-slate-900">Sistema Unificado</h1>
          <p className="mt-1 text-xs text-slate-500">Protótipo MVP · v0.1</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-teal-50 hover:text-teal-800"
            >
              <span className="text-base opacity-70">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4 text-xs text-slate-500">
          Multi-tenant ativo
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Cliente ativo</p>
            <p className="font-semibold text-slate-900">
              {activeOrganization.tradeName ?? activeOrganization.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <form action={switchOrganizationAction} className="flex items-center gap-2">
              <label htmlFor="organizationId" className="sr-only">
                Trocar cliente
              </label>
              <OrgSelect
                organizations={organizations}
                defaultValue={session.activeOrganizationId}
              />
            </form>

            <div className="text-right text-sm">
              <p className="font-medium text-slate-900">{session.user.name}</p>
              <p className="text-xs text-slate-500">{roleLabel[session.user.role]}</p>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Sair
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
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
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
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
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-teal-100 text-teal-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
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
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}
