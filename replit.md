# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Artifacts

### Order Notification System (`artifacts/order-notify`)
- **URL**: `/` (root)
- **Kind**: React + Vite web app
- **Purpose**: Bilingual (Arabic/English) cafe order notification system
- **Features**:
  - Staff control panel: enter order numbers, notify/clear
  - Customer display: large grid of ready order numbers
  - Audio bell alert (Web Audio API) on each new order
  - RTL/LTR language toggle (AR/EN)
  - Slide-in + pulse glow animation for newest order
  - CSS custom properties for easy brand color changes
  - Logo placeholder (`LOGO_URL` constant in `OrderSystem.tsx`)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
