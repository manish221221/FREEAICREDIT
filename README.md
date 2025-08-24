# AI Hub — Next.js Starter

A Next.js 15 app with Tailwind, shadcn/ui, and Genkit AI flows.

## Prerequisites
- Node.js 18+
- npm 9+

## Setup
```bash
npm ci
```

## Development
```bash
# Next.js dev server (Turbopack) on http://localhost:9002
npm run dev

# Genkit flow dev server
npm run genkit:dev
```

## Typecheck and Lint
```bash
npm run typecheck
npm run lint
```

## Build and Start
```bash
npm run build
npm start
```

## Environment
Create a .env file for runtime config, e.g.:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:9002
```

## Key Files
- `src/app/page.tsx`: Dashboard
- `src/ai/flows/*`: Genkit flows
- `src/app/not-found.tsx`: Custom 404
- `src/app/loading.tsx`: Global loading UI
- `src/app/robots.ts`, `src/app/sitemap.ts`: SEO routes
