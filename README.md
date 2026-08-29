# refeat

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Start, Convex, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Convex** - Reactive backend-as-a-service platform
- **Authentication** - Better-Auth
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)
- **Deployment** - Cloudflare Workers (web) + Convex cloud (backend)

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Convex Setup

This project uses Convex as a backend. You'll need to set up Convex before running the app:

```bash
pnpm run dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

Copy environment variables from `packages/backend/.env.local` to `apps/*/.env`.

Then, run the development server:

```bash
pnpm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Your app will connect to the Convex cloud backend automatically.

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@refeat/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Git Hooks and Formatting

- Run checks: `pnpm run check`

## Project Structure

```
refeat/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Start)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── backend/     # Convex backend functions and schema
```

## Available Scripts

- `pnpm run dev`: Start all applications in development mode
- `pnpm run build`: Build all applications
- `pnpm run dev:web`: Start only the web application
- `pnpm run dev:setup`: Setup and configure your Convex project
- `pnpm run check-types`: Check TypeScript types across all apps
- `pnpm run check`: Run Oxlint and Oxfmt
- `pnpm run deploy`: Deploy backend (Convex) + frontend (Cloudflare Workers)

## Deployment

The web app is deployed as a **Cloudflare Worker** using `@cloudflare/vite-plugin` + `wrangler` (see `apps/web/wrangler.jsonc`). Convex functions are deployed to Convex cloud.

One-time setup:

```bash
# Authenticate with Cloudflare (interactive, in a real terminal)
pnpm --filter web exec wrangler login
```

Deploy everything:

```bash
pnpm run deploy
```

This runs `convex deploy` (pushes backend functions to the production Convex deployment) and then `vite build && wrangler deploy` for the web app.

### Production environment variables

`VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` are baked into the client bundle at **build time** from `apps/web/.env`. Before a production deploy, make sure they point at the **production** Convex deployment (from `packages/backend/.env.local` / `npx convex deploy` output), not the dev one. For local overrides use `.env.production`, e.g.:

```bash
VITE_CONVEX_URL=https://<prod-deployment>.convex.cloud
VITE_CONVEX_SITE_URL=https://<prod-deployment>.convex.site
```

To test the production build locally in workerd:

```bash
pnpm --filter web preview:cf
```

### Auth environment variables (Convex, not Cloudflare)

Google OAuth runs inside Convex functions, so `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `BETTER_AUTH_SECRET` are **Convex environment variables** — nothing Google-related is configured on Cloudflare. Check/copy them with:

```bash
cd packages/backend
npx convex env list          # dev deployment
npx convex env list --prod   # production deployment
npx convex env set GOOGLE_CLIENT_ID <value> --prod
```

### Post-deploy: SITE_URL + Google Cloud Console

`SITE_URL` on the prod deployment must be your production web URL (used by better-auth as `baseURL`/`trustedOrigins` and to build the Google redirect). After the first `wrangler deploy` prints your Workers URL, run:

```bash
cd packages/backend
npx convex env set SITE_URL https://<your-worker>.workers.dev --prod
```

Then in [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) (OAuth client), add:

- **Authorized JavaScript origin**: `https://<your-worker>.workers.dev`
- **Authorized redirect URI**: `https://<prod-convex-deployment>.convex.site/api/auth/callback/google` (the prod deployment's `.convex.site` URL — it differs from the dev one)
