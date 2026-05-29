# Deploy na Vercel — Shift RH

Guia passo a passo para colocar o protótipo no ar e testar online.

## Pré-requisitos

- Repo no GitHub: https://github.com/fercarlim24/shift-rh
- Conta [Vercel](https://vercel.com) (login com GitHub)
- Postgres na nuvem — **Supabase** (recomendado se você já usa) ou [Neon](https://neon.tech)

> **Por que Postgres?** A Vercel roda em serverless — SQLite (arquivo local) não persiste entre requisições.

---

## Opção A — Supabase (recomendado)

### 1. Criar projeto / banco

1. [supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** (ou use um projeto existente e crie um schema dedicado — ver nota abaixo)
3. Nome sugerido: `shift-rh`
4. Anote a **senha do banco** ao criar o projeto

### 2. Copiar connection strings

**Project Settings** → **Database** → **Connection string** → aba **URI**

| Variável na Vercel | O que usar no Supabase |
|--------------------|-------------------------|
| `DATABASE_URL` | **Transaction** pooler (porta **6543**) — modo *Transaction* |
| `DIRECT_URL` | **Session** pooler ou **Direct** (porta **5432**) — para migrations |

Exemplo (substitua `[PASSWORD]` e `[PROJECT-REF]`):

```bash
# App (runtime) — Transaction pooler
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Migrations — Session pooler ou Direct connection
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
```

Marque **Use connection pooling** na UI do Supabase ao copiar a URL de runtime.

> **Projeto Supabase existente:** pode criar um **novo projeto** só para o Shift RH (mais simples) ou reutilizar o mesmo Postgres — as tabelas do Prisma ficam no schema `public`. Evite conflito de nomes se outro app já usar `User`, `Organization`, etc.

### 3. Importar na Vercel

1. [vercel.com/new](https://vercel.com/new) → `fercarlim24/shift-rh`
2. **Environment Variables**:

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | URI **Transaction** (6543) |
| `DIRECT_URL` | URI **Session** ou **Direct** (5432) |

3. **Deploy**

### 4. Seed (dados demo)

```bash
cd shift-rh
export DATABASE_URL="..."   # Transaction (6543)
export DIRECT_URL="..."     # Session/Direct (5432)
npm run db:seed
```

---

## Opção B — Neon

1. [console.neon.tech](https://console.neon.tech) → **New Project**
2. Copie **Pooled** → `DATABASE_URL`, **Direct** → `DIRECT_URL`
3. Mesmo fluxo Vercel + seed acima

---

## Build na Vercel

O comando de build executa automaticamente:

```bash
prisma generate && prisma migrate deploy && next build
```

`prisma migrate deploy` usa `DIRECT_URL` (via `prisma.config.ts`).

---

## Testar

URL da Vercel (ex.: `https://shift-rh.vercel.app`):

| E-mail | Senha |
|--------|-------|
| `patricia@shift.rh` | `demo123` |
| `admin@shift.rh` | `demo123` |

---

## Desenvolvimento local

```bash
git clone https://github.com/fercarlim24/shift-rh.git
cd shift-rh
npm install
cp .env.example .env
# Cole DATABASE_URL e DIRECT_URL do Supabase
npm run db:setup
npm run dev
```

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Postgres pooled (app) |
| `DIRECT_URL` | Sim | Postgres direct/session (migrations) |

---

## Troubleshooting

### Build falha em `prisma migrate deploy`

- **Supabase:** `DIRECT_URL` deve ser porta **5432** (Session ou Direct), não 6543
- **Neon:** `DIRECT_URL` sem `-pooler` no hostname
- Confirme `?sslmode=require` se a conexão exigir SSL

### Erro de prepared statements / Prisma

- Runtime (`DATABASE_URL`) no Supabase: use pooler **Transaction** com `?pgbouncer=true`
- Não use a URL Transaction (6543) em `DIRECT_URL`

### Login não persiste

- Acesse só via **HTTPS** (URL da Vercel)

### Página sem dados

- Rode `npm run db:seed` apontando para o banco de produção

### Região Vercel

`vercel.json` usa `gru1` (São Paulo). Remova `regions` se o plano não suportar.

---

## Próximos deploys

```bash
git push origin main
```

## Vercel CLI (opcional)

```bash
npm i -g vercel
cd shift-rh
vercel login
vercel link
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel --prod
```
