import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { btnPrimary, inputClass, labelClass } from "@/lib/ui-classes";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "1";

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.1fr_1fr]">
      <section className="login-mesh relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div className="relative z-10">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-[var(--radius)] bg-gradient-to-br from-[var(--accent)] to-[var(--highlight)] text-sm font-bold text-white shadow-[var(--shadow-accent)]">
            S
          </div>
          <h1 className="max-w-md text-5xl font-semibold leading-[1.05] tracking-tight text-white">
            Gestão de pessoas com precisão operacional
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-zinc-400">
            Recrutamento, admissões e colaboradores em um único ambiente multi-tenant.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3">
          {[
            { value: "2", label: "Clientes demo" },
            { value: "5", label: "Etapas pipeline" },
            { value: "100%", label: "Tenant isolado" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
            >
              <p className="font-mono text-2xl font-semibold text-white">{stat.value}</p>
              <p className="mt-1 text-xs text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div
          className="pointer-events-none absolute -right-24 top-1/3 h-64 w-64 rounded-full opacity-60 blur-3xl"
          style={{ background: "var(--accent-glow)" }}
        />
      </section>

      <section className="flex items-center justify-center bg-[var(--background)] px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[var(--radius)] bg-gradient-to-br from-[var(--accent)] to-[var(--highlight)] text-sm font-bold text-white">
              S
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Shift RH
            </h1>
          </div>

          <div className="login-card rounded-[var(--radius-lg)] p-8">
            <div className="mb-6 hidden lg:block">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
                Entrar
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Acesse sua conta Shift</p>
            </div>

            {hasError ? (
              <div className="ui-flash-enter mb-4 rounded-[var(--radius)] border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700">
                E-mail ou senha inválidos.
              </div>
            ) : null}

            <form action={loginAction} className="space-y-4">
              <div>
                <label htmlFor="email" className={labelClass}>
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue="patricia@shift.rh"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="password" className={labelClass}>
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  defaultValue="demo123"
                  className={inputClass}
                />
              </div>
              <button type="submit" className={`${btnPrimary} w-full`}>
                Entrar
              </button>
            </form>

            <div className="mt-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 text-xs leading-relaxed text-[var(--muted)]">
              <p className="font-medium text-[var(--foreground)]">Contas demo</p>
              <p className="mt-2">patricia@shift.rh / demo123 (consultor)</p>
              <p>admin@shift.rh / demo123 (admin)</p>
              <p>gestor@landscape.to / demo123 (cliente gestor)</p>
              <p>colaborador@landscape.to / demo123 (colaborador)</p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[var(--muted)]">
            <Link
              href="/dashboard"
              className="text-[var(--accent)] underline-offset-2 hover:underline"
            >
              Ir ao dashboard
            </Link>{" "}
            (requer login)
          </p>
        </div>
      </section>
    </div>
  );
}
