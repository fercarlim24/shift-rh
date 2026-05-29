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
- [Prisma](https://www.prisma.io/) + SQLite (local, zero config)

## Como rodar

```bash
git clone https://github.com/fercarlim24/shift-rh.git
cd shift-rh
npm install
npm run db:setup   # cria banco + seed demo
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Contas demo

| E-mail | Senha | Papel |
|--------|-------|-------|
| `patricia@shift.rh` | `demo123` | Consultor |
| `admin@shift.rh` | `demo123` | Admin Shift |

Use o seletor no topo para alternar entre **LandscapeLABs** e **Acme Tech** e ver o isolamento multi-tenant.

> O banco SQLite (`prisma/dev.db`) **não** vai para o git. Quem clonar roda `npm run db:setup`.

## Estrutura

```
src/app/(app)/     # páginas autenticadas
src/app/login/     # login demo
src/components/    # shell, kanban
src/lib/           # prisma, sessão, labels
prisma/            # schema + seed
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
4. Deploy (Vercel + Postgres)
5. Export PDF do funil R&S

---

Preparado para alinhamento interno Shift RH · Maio 2026 · v0.1
