# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # prisma generate + next build
npm run lint         # Biome check (read-only)
npm run lint:fix     # Biome check --write (auto-fix)
npm run format       # Biome format --write

npm run db:push      # Push schema changes to DB (no migrations — uses db push)
npm run db:generate  # Regenerate Prisma client after schema edits
npm run db:studio    # Open Prisma Studio
```

**Important:** `db:push` requires a direct (non-pooler) Neon connection. Use the direct URL:
```
DATABASE_URL=postgresql://...@ep-restless-math-aptxno3d.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=15
```
The `.env` file uses the pooler URL (for the app at runtime), which **does not** work with Prisma CLI commands.

There are **no tests**.

## Architecture

Next.js 16 App Router, React 19, Prisma 5 + Neon (PostgreSQL), Tailwind CSS v4, Biome for lint/format.

### Auth
Cookie-based JWT sessions via `jose`. `src/lib/auth.ts` exports:
- `getSession()` — returns `SessionUser | null` (lightweight, from JWT)
- `requireUser()` — returns full DB user or `null`
- `requireUserOrThrow()` — throws if unauthenticated (preferred in server components/API routes)

Always use `requireUserOrThrow()` in new code — `requireUser()` returns null and requires null-checking everywhere.

### API Routes
All routes use helpers from `src/lib/api.ts`:
- `jsonOk(data)` / `jsonError(message, status)`
- `parseJson<T>(request)` — safe JSON parse

### Database
Single `prisma/schema.prisma` with `db push` workflow (no migration files). Key models:

- **User** — auth + profile (name, avatarUrl, birthMonth/Day/Year)
- **Ceremony** — a birthday party. Has `birthdayUserId`, `adminUserId`, `hideContributors` (toggle for contributor visibility from birthday person)
- **CeremonyMember** — roles: `BIRTHDAY`, `ADMIN`, `GUEST`
- **Payment** — statuses: `DEBT` (pledge, pay later) → `PENDING` (proof submitted) → `APPROVED`/`REJECTED`
- **WishlistItem** — has `ogImage` and `ogDescription` (scraped from link URL via `/api/link-preview`)
- **Friendship** — statuses: `PENDING`, `ACCEPTED`
- **Group** + **GroupMember** — optional grouping of users around a ceremony

### Role/Permission helpers (`src/lib/ceremony-roles.ts`)
All async functions that check ceremony access:
- `canEditPartyWishlist(ceremony, userId)` — birthday holder or admin
- `canApprovePayments(ceremonyId, userId)` — admin only
- `canManagePartyTeam(ceremony, userId)` — birthday holder or admin
- `bootstrapCeremonyMembers(...)` — call after ceremony creation to seed members

### Notifications (`src/lib/notifications.ts`)
- `notifyUser(...)` — creates DB record + sends push notification (awaited)
- `notifyUserAsync(...)` — fire-and-forget version (use in API routes to avoid blocking)
- `notifyMany(userIds, ...)` — batch notify

### Avatars (`src/lib/avatars.ts`)
Avatars stored as `preset:<id>` strings (e.g. `preset:cake`). Use `parsePresetAvatar()` to resolve to `{ emoji, bg, ring, label }`. The `UserAvatar` component handles both preset and initials fallback.

### Date handling (`src/lib/jalali.ts`)
All birthday dates are stored as Gregorian integers (`birthMonth`, `birthDay`, `birthYear`) but displayed in Jalali (Shamsi) format using `dayjs` + `jalaliday`. Use `formatJalaliBirthday(month, day, year?)` for display.

### Icons (`src/components/icon.tsx`)
Uses a whitelist map of Lucide icons. Add new icons to both the `import` and the `icons` object — do not use Lucide components directly in pages.

### Key pages
- `/explore` — all users grid, links to `/person/[id]`
- `/person/[id]` — profile page with friend actions, mutual groups, wishlist (friends-only)
- `/ceremonies/[id]` — party page with tabs: Wishlist / Contribute / Treasurer (admin) / My gifts (birthday person)
- `/wishlist` — user's own wishlist with rich link preview cards

### Link Preview
`/api/link-preview?url=...` fetches OG metadata server-side (title, description, image, price). Called from the wishlist form on URL paste/blur. Results stored as `ogImage`/`ogDescription` on `WishlistItem`.

### PWA / Push
VAPID keys in `.env`. `src/lib/push.ts` handles web push subscriptions. The cron job at `/api/cron/birthdays` sends birthday reminders (triggered externally with `CRON_SECRET`).
