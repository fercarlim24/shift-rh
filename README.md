# Shift RH — MVP Fase 1.1

Protótipo Next.js 16 + TypeScript + Tailwind + Prisma/PostgreSQL para o sistema unificado de RH da Shift.

## Requisitos

- Node.js 20+
- Docker (banco local) ou PostgreSQL remoto

## Setup local

```bash
cp .env.example .env
# Edite SESSION_SECRET (mín. 16 caracteres) e DATABASE_URL
npm run local:setup   # sobe Postgres, migra e faz seed
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Conexão PostgreSQL (pooler em produção) |
| `DIRECT_URL` | Conexão direta para migrations |
| `SESSION_SECRET` | Chave HMAC para assinar cookie de sessão (mín. 16 chars; obrigatório em produção) |

Em desenvolvimento, se `SESSION_SECRET` não estiver definido, um fallback local é usado.

## Contas demo (senha: `demo123`)

| E-mail | Papel |
|--------|-------|
| `admin@shift.rh` | Admin Shift — acesso total |
| `patricia@shift.rh` | Consultor Shift — só LandscapeLABs (vínculo explícito) |
| `gestor@landscape.to` | Cliente Gestor — só LandscapeLABs (leitura) |
| `colaborador@landscape.to` | Colaborador — só suas tarefas e perfil |

Senhas são armazenadas com **bcrypt**. O cookie de sessão é assinado com **HMAC-SHA256** (`SESSION_SECRET`).

## Rotas

### Públicas

| Rota | Descrição |
|------|-----------|
| `/` | Redirect para dashboard ou login |
| `/login` | Autenticação |

### Autenticadas

| Rota | CRUD / função |
|------|---------------|
| `/dashboard` | KPIs |
| `/clientes` | listar |
| `/clientes/novo` | criar |
| `/clientes/[id]` | detalhe |
| `/clientes/[id]/editar` | editar |
| `/vagas` | listar |
| `/vagas/nova` | criar |
| `/vagas/[id]` | detalhe + resumo pipeline |
| `/vagas/[id]/editar` | editar |
| `/vagas/[id]/candidatos` | candidatos da vaga |
| `/candidatos` | listar |
| `/candidatos/novo` | criar |
| `/candidatos/[id]` | detalhe |
| `/candidatos/[id]/editar` | editar |
| `/recrutamento` | kanban R&S |
| `/tarefas` | listar + filtros |
| `/tarefas/nova` | criar |
| `/tarefas/[id]` | detalhe |
| `/tarefas/[id]/editar` | editar |
| `/admissoes` | listar |
| `/admissoes/nova` | criar |
| `/admissoes/[id]` | detalhe + histórico + upload de documentos |
| `/admissoes/[id]/editar` | editar |
| `/colaboradores` | listar |
| `/colaboradores/novo` | criar |
| `/colaboradores/[id]` | detalhe |
| `/colaboradores/[id]/editar` | editar |
| `/usuarios` | listar usuários (admin) |
| `/usuarios/novo` | criar usuário (admin) |
| `/usuarios/[id]` | detalhe do usuário (admin) |
| `/usuarios/[id]/editar` | editar usuário (admin) |
| `/usuarios/[id]/acessos` | vínculos consultor ↔ cliente (admin) |
| `/configuracoes/pipeline` | etapas do pipeline por organização |

Todas as rotas autenticadas exigem sessão válida e assinada (`requireSession` no layout `(app)`).

## Multi-tenant

- `activeOrganizationId` na sessão (cookie HTTP-only assinado)
- Queries filtradas por `organizationId` via `scopedWhere()`
- Troca de cliente validada em `canAccessOrganization()`
- Consultor Shift só acessa organizações com `UserOrganizationAccess`
- Gestor e colaborador restritos à própria organização

## Papéis (RBAC)

| Papel | Escopo |
|-------|--------|
| `SHIFT_ADMIN` | Tudo, incluindo usuários e acessos |
| `SHIFT_CONSULTANT` | CRUD operacional nas organizações vinculadas |
| `CLIENT_VIEWER` | Leitura da própria organização |
| `COLLABORATOR` | Próprias tarefas e perfil de colaborador |

Permissões em `src/lib/permissions.ts`. Server actions ficam em `src/app/actions/` (um arquivo por domínio — não usar barrel `actions.ts`, incompatível com Next.js).

## Integrações (mock)

Interfaces e mocks em `src/lib/integrations/`:

- **Autentique** — envio simulado de documentos para assinatura
- **Convênia** — sync de colaboradores
- **Google Workspace** — provisionamento de usuários
- **Brevo/Mailchimp** — campanhas de e-mail
- **WhatsApp Business** — templates de mensagem

## Upload de documentos (MVP)

Anexos de admissão são persistidos localmente no banco (`OnboardingDocument`): metadata + conteúdo base64 (limite 2 MB). Sem storage externo (S3, etc.) nesta fase.

## Auditoria

- Campos `createdAt`, `updatedAt`, `archivedAt`, `createdById`, `updatedById` nas entidades principais
- Tabela `AuditLog` para ações críticas (criar/editar vaga, mover candidato, admissão, etc.)
- `OnboardingEvent` para histórico de admissões

## Scripts

```bash
npm run dev          # desenvolvimento
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run test         # Vitest (auth, sessão, RBAC, tenant)
npm run audit        # checagens de seed, RBAC, sessão e tenant
npm run build        # generate + migrate + build Next.js
npm run db:migrate   # nova migration (dev)
npm run db:deploy    # aplicar migrations
npm run db:seed      # popular banco demo
```

## O que permanece mockado / fora do escopo

- API real do Autentique, Convênia, Google, Brevo, WhatsApp
- Storage externo para arquivos (upload usa banco como adapter)
- JWT / OAuth — apenas cookie assinado com HMAC
- Convite por e-mail e fluxo self-service de cadastro
- Automação contratado → admissão
- Portal self-service do colaborador além de tarefas/perfil

## Deploy

Ver [docs/DEPLOY.md](docs/DEPLOY.md).
