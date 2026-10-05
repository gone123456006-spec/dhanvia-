# Dhanvia

Business registration and financial services platform.

---

## Project Structure

```
dhanvia/
├── backend/                    # Express API
│   └── src/
│       ├── app.ts              # Express app factory (middleware, routes)
│       ├── server.ts           # Entry point — connects to MongoDB, starts HTTP server
│       ├── config/             # Environment variables & MongoDB connection
│       ├── models/             # Mongoose models (Lead, SupportRequest)
│       ├── validation/         # Zod request schemas
│       ├── middleware/         # Error handling, admin auth, rate limits
│       ├── controllers/        # Request handlers
│       └── routes/             # Public form routes + /api/admin routes
│
├── frontend/                   # Vite + React (TypeScript) SPA
│   ├── public/                 # Static assets served as-is
│   └── src/
│       ├── main.tsx            # React entry point
│       ├── App.tsx             # Root composition component
│       │
│       ├── components/         # UI components (one responsibility each)
│       │   ├── index.ts        # Barrel re-export
│       │   ├── Brand.tsx
│       │   ├── CompanyServices.tsx
│       │   ├── FAQ.tsx
│       │   ├── HeroBanner.tsx
│       │   ├── ProcessIllustration.tsx
│       │   ├── RegistrationOfferAndCatalog.tsx
│       │   ├── RegistrationProcess.tsx
│       │   ├── ServiceIcon.tsx
│       │   ├── SiteFooter.tsx
│       │   └── SiteHeader.tsx
│       │
│       ├── constants/          # Static data & TypeScript interfaces
│       │   └── data.ts         # FAQ, bannerSlides, services, catalog data
│       │
│       ├── styles/             # CSS partials (imported by App.css)
│       │   ├── tokens.css      # CSS custom properties (colours, fonts)
│       │   ├── layout.css      # Site shell & shared layout utilities
│       │   ├── header.css      # Navigation & CTA button
│       │   ├── hero.css        # Image carousel
│       │   ├── registration.css # Registration steps, offer, form
│       │   ├── services.css    # Services grid & catalog panel
│       │   ├── faq.css         # FAQ accordion
│       │   └── footer.css      # Site footer
│       │
│       ├── App.css             # CSS entry point — @imports all partials
│       └── index.css           # Global base styles & resets
│
├── package.json                # Root scripts (dev, build, preview)
└── vite.config.ts
```

---

## Development

Requires Node.js 22 or newer.

```bash
# Install dependencies (root + backend)
npm install
npm --prefix backend install

# Configure the backend (MongoDB Atlas connection string, timezone, etc.)
cp backend/.env.example backend/.env

# Create the first Super Admin login (asks for name, email, password)
npm --prefix backend run create-admin

# Terminal 1 – API on http://localhost:3001
npm run dev:api

# Terminal 2 – website on http://localhost:5173, admin panel on http://localhost:5173/admin
npm run dev
```

The Vite dev server proxies `/api` to the backend on port 3001.

If the API fails with `querySrv EBADRESP` while connecting to Atlas, your network's DNS server can't resolve `mongodb+srv://` records for Node. Set `DNS_SERVERS=8.8.8.8,1.1.1.1` in `backend/.env`.

### MongoDB Atlas setup

1. Create a cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database Access** → add a database user with read/write access.
3. **Network Access** → allow your server's IP (avoid `0.0.0.0/0` in production).
4. **Database** → **Connect** → **Drivers** → copy the `mongodb+srv://` string into `MONGODB_URI` in `backend/.env`.

Collections and indexes are created automatically on first start.

## Production

In production one Node process serves everything: the API under `/api`, the public website, and the admin panel under `/admin`. All of them share one domain, so cookies and CORS need no extra setup.

### Recommended: Vercel (website, admin panel and API in one project)

`vercel.json` deploys the repo as one Vercel project with two services on one domain:

- **`app`**: the Vite build (public website and `/admin`), served from the repository root.
- **`backend`**: the Express API in `backend/`, running as a Vercel Function. Every `/api/*` request goes to it with the path unchanged, so the frontend keeps calling `/api` on its own domain and login cookies need no cross-domain setup.

On Vercel the API has no long-running process. The reminder engine runs in the background after API requests (at most every `REMINDER_INTERVAL_MINUTES` per instance, so it keeps running while the admin panel is open), and Vercel Cron also calls `GET /api/cron/reminders` once a day at 08:00 IST.

**1. Atlas:** under Network Access, allow `0.0.0.0/0`, because Vercel Functions have no fixed outbound IPs. Use a strong database password.

**2. Vercel project:**

1. Push the repo to GitHub, then go to Vercel → **Add New** → **Project** and import it.
2. Keep the **Root Directory** as the repository root. Build settings come from `vercel.json`.
3. Under **Settings → Environment Variables**, add:
   - `MONGODB_URI`: your Atlas connection string.
   - `CRON_SECRET`: a random string of at least 16 characters (`openssl rand -hex 32`). Vercel sends it with each cron call; the cron route stays disabled without it.
   - Optional: `MONGODB_DB_NAME` (default `dhanvia`), `APP_TIMEZONE` (default `Asia/Kolkata`), `SESSION_TTL_DAYS`.
4. Leave `VITE_API_BASE_URL` unset.
5. Deploy, then check `https://<your-project>.vercel.app/api/health` reports `"database": "connected"`, and open `/admin`.

The daily cron schedule works on the Hobby plan. On Pro you can run it more often, for example `*/5 * * * *` in `vercel.json`.

**3. First Super Admin:** run `npm --prefix backend run create-admin` on your own computer with `backend/.env` pointing at the same Atlas database. Users live in the database, so the account works on the deployed site immediately.

**4. Verify the client IP:** after logging in once, open the function logs for the `backend` service. The `ip` field in request log lines should be your real public IP. If it shows a Vercel address, change `TRUST_PROXY`. Rate limiting depends on this value.

**Custom domain:** add `www.dhanvia.com` in Vercel → Settings → Domains.

**Local check of the Vercel setup:** `vercel dev` runs both services together with the same routing.

### Option A: plain Node (VPS, PM2, systemd)

```bash
npm ci && npm --prefix backend ci
npm run build:all                         # builds frontend/dist and backend/dist
npm --prefix backend run create-admin:prod   # first time only
npm start                                 # NODE_ENV=production node backend/dist/server.js
```

`npm start` reads `backend/.env` if it exists, otherwise the platform's environment variables. Put Nginx, Caddy or a cloud load balancer in front for HTTPS and forward to port 3001. With PM2: `pm2 start npm --name dhanvia -- start`.

### Option B: Docker

```bash
docker build -t dhanvia .
docker run -d --name dhanvia -p 3001:3001 --env-file backend/.env --restart unless-stopped dhanvia
docker exec -it dhanvia node dist/scripts/createSuperAdmin.js   # first time only
```

The image runs as a non-root user, has a built-in health check, and never contains `.env` files.

### Production checklist

- Serve over **HTTPS**. Session cookies are `Secure` by default when `NODE_ENV=production`.
- Set `TRUST_PROXY` to the number of proxies in front of the app (usually `1`), so rate limiting sees real client IPs.
- Restrict Atlas **Network Access** to your server's IP and use a strong, unique database password.
- Running several instances? Set `RUN_JOBS=false` on all but one, so reminders aren't sent twice.
- Point uptime monitoring or the load balancer at `GET /api/health`. It returns `503` when the database is down or the server is shutting down.

### What the server handles

- **Security headers** (Helmet): Content Security Policy, HSTS (when HTTPS), frame protection, `nosniff`.
- **Gzip compression.** Hashed assets in `/assets` are cached for a year and HTML is never cached, so deploys show up immediately.
- **SPA fallbacks:** `/admin/*` serves the admin app and other page routes serve the website.
- **Validated configuration:** the server refuses to start and lists every invalid or missing variable.
- **Structured JSON logs** in production, one line per API request with a request ID. The same ID is returned in the `X-Request-Id` header and in 500 responses, so a user's error can be matched to the log line.
- **Graceful shutdown** on `SIGTERM`/`SIGINT`: stops accepting traffic, finishes in-flight requests and reminder runs, closes MongoDB, and force-exits after `SHUTDOWN_TIMEOUT_MS`.
- **Rate limits:** website forms 10 per 15 min per IP, logins 10 failed attempts per 15 min, admin API 600 requests per minute.

## API overview

| Path | Description |
|------|-------------|
| `GET /api/health` | Readiness: API + database status (`503` when not ready) |
| `GET /api/health/live` | Liveness: process is up |
| `POST /api/leads` | Website consultation form |
| `POST /api/support-requests` | Website contact form, returns a ticket number |
| `/api/auth/*` | Admin login, logout, current user, change password (cookie session) |
| `/api/admin/*` | CRM: leads, pipeline, calls, tasks, customers, team, reports, notifications, settings |

Admin routes need a signed-in session cookie and the `X-Requested-With: dhanvia-admin` header (CSRF protection). Access is limited by role: Super Admin or Sales.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (website + admin) |
| `npm run dev:api` | API with auto-reload |
| `npm run build` | Build the frontend into `frontend/dist` |
| `npm run build:all` | Build frontend and backend |
| `npm start` | Run the production server |
| `npm run lint` | Run ESLint |
| `npm --prefix backend run create-admin` | Create or reset a Super Admin (development) |
| `npm --prefix backend run create-admin:prod` | Same, using the compiled build |

---

## Architecture Notes

- **`App.tsx`** is a pure composition root — no local state other than the shared `selectedRegistrationService` that bridges `RegistrationOffer` and `ServiceCatalog`.
- **`components/`** — each file has a single, named responsibility. Import from `'./components'` (the barrel) to avoid deep paths.
- **`constants/data.ts`** — all static content lives here. To change copy, only touch this file.
- **`styles/`** — CSS is split by page section. To change any section's styles, open the corresponding partial.
