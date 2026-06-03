# Birthday

Web app for Jalali birthday reminders, friend groups, wishlists, and pooled gifts.

## Features

- Jalali date picker · Groups · Wishlists · Treasurer payments
- **PWA** — install to home screen, custom app icon
- **Web Push** — device notifications for birthdays, parties, payments

## Local setup

```bash
bun install
cp .env.example .env
bun run vapid   # copy keys into .env
bun run db:push
bun run dev
```

### Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon / Postgres |
| `AUTH_SECRET` | Session JWT |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push (public) |
| `VAPID_PRIVATE_KEY` | Web Push (secret) |
| `VAPID_SUBJECT` | `mailto:you@example.com` |
| `BLOB_READ_WRITE_TOKEN` | Payment proof uploads |
| `CRON_SECRET` | Birthday cron auth |

### Enable push on a device

1. Open the app over **HTTPS** (or `localhost` for dev).
2. Go to **Profile** → **Enable push notifications**.
3. Accept the browser permission.
4. Optional: use **Install** banner to add PWA to home screen.

Push is sent automatically whenever an in-app notification is created (birthday cron, friend requests, payments, etc.).

## Deploy (Vercel)

Add all env vars above. Push requires VAPID keys on the server and HTTPS in production.

```bash
bun run build
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server |
| `bun run vapid` | Generate VAPID key pair |
| `bun run db:push` | Sync database schema |
