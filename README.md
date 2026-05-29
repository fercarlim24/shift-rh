# Shift RH — Protótipo MVP

Protótipo navegável do **Sistema Interno Unificado de RH** da Shift, cobrindo o núcleo operacional da Fase 1:

- Multi-tenant (troca de cliente no header)
- Gestão de vagas
- Pipeline de R&S (kanban)
- Gestão de tarefas
- Admissões com fluxo Autentique **simulado**
- Suporte CLT + PJ nos dados seed

Piloto de referência: **Ecossistema Landscape (LandscapeLABs)**.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/) + PostgreSQL ([Neon](https://neon.tech))

## Deploy (Vercel)

Guia completo: **[docs/DEPLOY.md](docs/DEPLOY.md)**

Resumo rápido:

1. Crie um banco no **Neon** (gratuito)
2. Importe o repo na **Vercel**: https://github.com/fercarlim24/shift-rh
3. Configure as env vars `DATABASE_URL` (pooled) e `DIRECT_URL` (direct)
4. Deploy → depois rode `npm run db:seed` uma vez com as URLs de produção

## Desenvolvimento local

```bash
git clone https://github.com/fercarlim24/shift-rh.git
cd shift-rh
npm install
cp .env.example .env
# Cole DATABASE_URL e DIRECT_URL do Neon
npm run db:setup
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Contas demo

| E-mail | Senha | Papel |
|--------|-------|-------|
| `patricia@shift.rh` | `demo123` | Consultor |
| `admin@shift.rh` | `demo123` | Admin Shift |

Use o seletor no topo para alternar entre **LandscapeLABs** e **Acme Tech** e ver o isolamento multi-tenant.

## Estrutura

```
src/app/(app)/     # páginas autenticadas
src/app/login/     # login demo
src/components/    # shell, kanban
src/lib/           # prisma, sessão, labels
prisma/            # schema + migrations + seed
docs/DEPLOY.md     # guia Vercel + Neon
```

## O que é mock vs. real

| Feature | Status no protótipo |
|---------|---------------------|
| Multi-tenant | Real (filtro por `organizationId`) |
| Login | Demo (cookie + senha em texto no seed) |
| Autentique | Mock (botões simulam envio/assinatura) |
| Convênia / Monday / Notion | Substituídos pelos módulos nativos |
| Relatório PDF R&S | Fora do escopo deste protótipo |

## Próximos passos sugeridos

1. Auth real (NextAuth ou similar) + hash de senha
2. CRUD completo (criar vaga, candidato, tarefa)
3. Integração Autentique (webhook)
4. Export PDF do funil R&S

---

Preparado para alinhamento interno Shift RH · Maio 2026 · v0.1
