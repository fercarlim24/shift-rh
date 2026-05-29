import Link from "next/link";
import { loginAction } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">
            Shift RH
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Sistema Unificado</h1>
          <p className="mt-2 text-sm text-slate-600">
            Protótipo MVP — piloto Landscape
          </p>
        </div>

        {hasError ? (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            E-mail ou senha inválidos.
          </div>
        ) : null}

        <form action={loginAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue="patricia@shift.rh"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              defaultValue="demo123"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">Contas demo</p>
          <p className="mt-2">patricia@shift.rh / demo123 (consultor)</p>
          <p>admin@shift.rh / demo123 (admin)</p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link href="/dashboard" className="underline">
            Ir ao dashboard
          </Link>{" "}
          (requer login)
        </p>
      </div>
    </div>
  );
}
