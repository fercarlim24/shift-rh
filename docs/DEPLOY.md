# Deploy na Vercel — Shift RH

Guia passo a passo para colocar o protótipo no ar e testar online.

## Pré-requisitos

- Repo no GitHub: https://github.com/fercarlim24/shift-rh
- Conta [Vercel](https://vercel.com) (login com GitHub)
- Conta [Neon](https://neon.tech) (Postgres gratuito; funciona bem com Vercel)

> **Por que Postgres?** A Vercel roda em serverless — SQLite (arquivo local) não persiste entre requisições.

---

## 1. Criar banco no Neon

1. Acesse [console.neon.tech](https://console.neon.tech) → **New Project**
2. Nome sugerido: `shift-rh`
3. Região: **AWS São Paulo (sa-east-1)** se disponível, ou US East
4. No dashboard do projeto, copie:
   - **Pooled connection** → será `DATABASE_URL`
   - **Direct connection** → será `DIRECT_URL`

---

## 2. Importar projeto na Vercel

1. [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → `fercarlim24/shift-rh`
3. Framework detectado: **Next.js** (não altere)
4. Em **Environment Variables**, adicione:

| Variável | Valor | Ambientes |
|----------|-------|-----------|
| `DATABASE_URL` | URL pooled do Neon | Production, Preview, Development |
| `DIRECT_URL` | URL direct do Neon | Production, Preview, Development |

5. Clique **Deploy**

O build roda automaticamente:

```bash
prisma generate && prisma migrate deploy && next build
```

---

## 3. Popular dados demo (seed)

Após o primeiro deploy bem-sucedido, rode o seed **uma vez** apontando para o banco de produção:

```bash
# Na sua máquina, com as URLs do Neon:
export DATABASE_URL="postgresql://..."
export DIRECT_URL="postgresql://..."
npm run db:seed
```

Ou use `vercel env pull .env.local` (com [Vercel CLI](https://vercel.com/docs/cli)) e depois `npm run db:seed`.

Contas criadas pelo seed:

| E-mail | Senha |
|--------|-------|
| `patricia@shift.rh` | `demo123` |
| `admin@shift.rh` | `demo123` |

---

## 4. Testar

Abra a URL que a Vercel gerou (ex.: `https://shift-rh.vercel.app`):

1. Login com `patricia@shift.rh` / `demo123`
2. Troque cliente no header (LandscapeLABs ↔ Acme Tech)
3. Navegue: Dashboard, Vagas, R&S, Tarefas, Admissões

---

## Desenvolvimento local (com Neon)

```bash
git clone https://github.com/fercarlim24/shift-rh.git
cd shift-rh
npm install
cp .env.example .env
# Cole DATABASE_URL e DIRECT_URL do Neon no .env
npm run db:setup
npm run dev
```

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Postgres (pooled no Neon) |
| `DIRECT_URL` | Sim* | Conexão direta para migrations |

\*Se usar Postgres sem pooler, repita a mesma URL em ambas.

---

## Troubleshooting

### Build falha em `prisma migrate deploy`

- Confirme `DIRECT_URL` (não a pooled) nas env vars da Vercel
- No Neon, a direct URL **não** contém `-pooler` no hostname

### Login não persiste

- Cookies usam `secure: true` em production — acesse sempre via **HTTPS** (URL da Vercel)

### Página sem dados

- Rode `npm run db:seed` com as URLs de produção (passo 3)

### Região

O `vercel.json` define `gru1` (São Paulo). Se o plano não suportar, remova `regions` do arquivo.

---

## Próximos deploys

Cada push na branch `main` dispara deploy automático na Vercel (se o projeto estiver linkado).

```bash
git push origin main
```

---

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
