# SGE — Sistema de Gestão Educacional

Monorepo para a plataforma de gestão educacional. Stack: **NestJS + React/Vite + PostgreSQL (Prisma)**.

## Estrutura

```
sge/
├── apps/
│   ├── api/      # NestJS (REST + Prisma)
│   └── web/      # React + Vite + shadcn/ui
├── packages/
│   └── shared/   # DTOs, enums, zod schemas (partilhados)
├── .github/      # CI
└── turbo.json    # pipeline de tarefas
```

## Pré-requisitos

- **Node.js** ≥ 20.11 (recomendado 22)
- **pnpm** 9.x (`npm i -g pnpm`)
- Conta **Neon** (Postgres), **Upstash** (Redis, a partir do Sprint 5) e **Resend** (mail)

## Setup rápido

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# editar apps/api/.env com a DATABASE_URL do Neon e os secrets JWT

# 3. Gerar cliente Prisma + aplicar migrations
pnpm --filter @sg/api prisma:generate
pnpm --filter @sg/api prisma:migrate

# 4. Seed (cria admin/teacher/student — password: Password123!)
pnpm --filter @sg/api prisma:seed

# 5. Arrancar API + Web em paralelo
pnpm dev
```

- API: http://localhost:3000/api/health
- Web: http://localhost:5173

## Scripts

| Comando | Descrição |
|---|---|
| `pnpm dev` | Arranca API + Web em modo watch |
| `pnpm build` | Build de todos os packages |
| `pnpm lint` | ESLint em todo o monorepo |
| `pnpm typecheck` | TypeScript sem emit |
| `pnpm test` | Testes (Jest + Vitest) |
| `pnpm format` | Formata com Prettier |

## Roadmap

| Sprint | Entrega | Requisitos |
|---|---|---|
| 0 | Fundação + monorepo + CI | — |
| 1 | Auth + Cadastros base + Mail | RF01, RF02 |
| 2 | Inscrição (revisão manual + vagas) + Matrícula | RF03 |
| 3 | Avaliação configurável + Notas + Presença (QR) | RF04, RF05 |
| 4 | Pagamentos Mock Multicaixa + Auditoria | RNF01, RNF02 |
| 5 | Importador legado (CSV+SQL, 250k) + Polish + E2E | RNF03 |
| 6 | Deploy (Render + Vercel + Neon + R2) | — |

## Convenções

- Commits: [Conventional Commits](https://www.conventionalcommits.org/) com scope (`feat(auth): ...`).
- Formatação: Prettier (aspas simples, trailing comma all, 100 colunas).
- Tipos partilhados em `@sg/shared`.
