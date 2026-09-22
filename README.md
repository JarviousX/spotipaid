# SpotiPaid

Music trades. Artists get paid.

SpotiPaid routes creator fees toward artist obligations on Solana-linked music tokens. **SpotiPaid is not affiliated with or endorsed by Spotify.** Tokens do not represent ownership of music, masters, publishing, Spotify royalties, or equity.

## Stack

- Next.js (App Router) + React
- Prisma + SQLite (local demo)
- Solana wallet adapter (optional RPC)
- Recharts analytics

## Setup

```bash
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma DB (default SQLite `file:./dev.db`) |
| `DEMO_MODE` | Prefer demo providers / labeling when `true` |
| `FEE_ARTIST_BPS` / `FEE_PROTOCOL_BPS` | Default fee split (must sum to `10000`) |
| `ADMIN_JWT_SECRET` | HMAC secret for admin session cookies (required in production) |
| `ADMIN_SESSION_TTL` | Session lifetime in seconds (default 1h) |
| `ADMIN_PASSPHRASE_HASH` | bcrypt hash for `/adm1n` passphrase login — generate with `node scripts/hash-admin-passphrase.mjs` |
| `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD` | Optional; `prisma/seed.ts` hashes into `AdminUser` for legacy `/admin` |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Optional Spotify Web API; blank → demo music provider |
| `SOLANA_RPC_URL` | Optional; blank → demo chain adapter |
| `PUMPFUN_API_KEY` | Optional launchpad ingest |

Never commit real production secrets. Demo admin passwords are stored **hashed** in the database after seed.

### Demo mode

With `DEMO_MODE=true` (default) and after seed, the UI labels demo datasets. Analytics, payments, and catalogs fall back to in-memory demo data when the DB is empty.

### Database seed

```bash
npm run db:seed
```

Seeds artists, tokens, fee claims, trades, and protocol settings. Optionally seeds a DB `AdminUser` when `ADMIN_BOOTSTRAP_*` is set.

### ADM1N (`/adm1n`)

Privileged protocol console — **not** secured by obscurity.

1. Generate a passphrase hash (never commit the plaintext):
   ```bash
   node scripts/hash-admin-passphrase.mjs
   ```
2. Set `ADMIN_PASSPHRASE_HASH` and a strong `ADMIN_JWT_SECRET` in `.env`.
3. Visit [/adm1n/login](http://localhost:3000/adm1n/login) and authenticate.
4. Session cookie `sp_adm1n_session`: HttpOnly, SameSite=Strict, short TTL. CSRF required on mutating APIs.

Manage CA, fee wallet, X account, maintenance freeze, and audit / wallet-activity logs.

Legacy ops console remains at `/admin` when a seeded AdminUser exists.

### Optional integrations

- **Spotify** — set client id/secret to resolve live catalog URLs in launch flows; otherwise demo metadata is used.
- **Solana RPC** — set `SOLANA_RPC_URL` for live chain reads; otherwise the demo adapter is used.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:push` | Push Prisma schema |
| `npm run db:seed` | Seed demo + admin |
| `npm test` | Vitest |
| `npm run typecheck` | TypeScript check |

## Primary routes

- `/` — home
- `/explore`, `/artists`, `/payments`, `/analytics`, `/launch`
- `/payments/[id]` — settlement receipt
- `/adm1n` — privileged protocol console (passphrase hash auth)
- `/admin` — legacy RBAC console (optional seeded AdminUser)
- `/maintenance` — public maintenance screen
- `/terms`, `/privacy`, `/disclosures`, `/risks`, `/opt-out`, `/report`

## License / trust

See in-app [/disclosures](/disclosures) and [/risks](/risks). Not financial advice. Tokens can lose all value.
