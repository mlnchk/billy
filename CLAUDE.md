# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server (http://localhost:5173)
pnpm build            # TypeScript check + Vite build
pnpm lint             # ESLint
pnpm test             # Run vitest

# Database
pnpm drizzle:update         # Generate migrations from schema changes
pnpm db:migrate             # Apply migrations locally
pnpm db:migrate:remote      # Apply migrations to production

# Deployment
pnpm deploy           # Build + deploy to Cloudflare Workers
pnpm tunnel           # Create localtunnel for bot webhook testing
```

## Architecture

Billy is a Telegram bot + mini-app for bill splitting. Users photograph bills, AI extracts items, participants vote on what they ordered, app calculates who pays what.

### Stack
- **Frontend**: React 19 + TanStack Router + React Query
- **Backend**: Hono on Cloudflare Workers
- **Database**: D1 (SQLite) + Drizzle ORM
- **Bot**: Grammy
- **AI**: Google Gemini 2.0 Flash for bill image parsing

### Backend Structure

```
/src/worker/
  index.ts              # Entry point, routes /api/bot/* and /api/client/*
  /domain/              # Business logic as plain functions
    bills.ts            # parseAndSaveBill, getBillSplit, getBillWithVotes...
    voting.ts           # voteForBill, updateVotesForBillItem...
    users.ts            # findOrCreateUser, findUserById...
  /services/
    ai.ts               # External: Gemini API wrapper
    calculator.ts       # Pure: bill split calculation
    db.ts               # Schema + setupDb()
  /routes/api.ts        # Hono REST endpoints for mini-app
  /bot/                 # Grammy bot handlers
```

### Domain Layer Pattern

All domain functions take `db: DB` as first param (explicit dependency):

```typescript
// Good - pure function, explicit db
export async function getBillSplit(db: DB, billId: number) { ... }

// Usage in routes
const result = await bills.getBillSplit(db, billId);
```

This pattern:
- No repos, no service classes - Drizzle IS the abstraction
- Functions grouped by use-case, not entity
- Pure business logic separated in `calculator.ts`
- Easy to test, easy to understand data flow

### Data Flow

```
Telegram Bot → domain/* → Drizzle → D1
React App → /api/client/* → domain/* → Drizzle → D1
```

### Database Schema

4 tables: `bills`, `billItems`, `itemAssignments`, `users`
- Schema defined in `src/worker/services/db.ts`
- Types exported: `Bill`, `BillItem`, `BillWithItems`, `User`

### Frontend Routes

File-based routing in `/src/routes/`:
- `/app/bill/$billId/vote` - Vote on items
- `/app/bill/$billId/items` - Item breakdown
- `/app/bill/$billId/totals` - Final calculation

## Key Files

- `src/worker/domain/bills.ts` - Core bill operations
- `src/worker/services/calculator.ts` - Split calculation (pure function)
- `src/worker/services/ai.ts` - Bill image parsing
- `src/worker/bot/index.ts` - Telegram command handlers
