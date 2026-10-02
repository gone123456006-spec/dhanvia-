# Dhanvia

Business registration and financial services platform.

---

## Project Structure

```
dhanvia/
├── backend/                    # Express API
│   └── src/
│       ├── app.ts              # Express app factory (middleware, routes)
│       ├── server.ts           # Entry point — starts HTTP server
│       ├── controllers/
│       │   └── health.controller.ts
│       └── routes/
│           └── health.routes.ts
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

```bash
# Install dependencies (root + backend)
npm install
cd backend && npm install && cd ..

# Start frontend dev server
npm run dev

# Start backend (separate terminal)
cd backend && npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite frontend dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

---

## Architecture Notes

- **`App.tsx`** is a pure composition root — no local state other than the shared `selectedRegistrationService` that bridges `RegistrationOffer` and `ServiceCatalog`.
- **`components/`** — each file has a single, named responsibility. Import from `'./components'` (the barrel) to avoid deep paths.
- **`constants/data.ts`** — all static content lives here. To change copy, only touch this file.
- **`styles/`** — CSS is split by page section. To change any section's styles, open the corresponding partial.
