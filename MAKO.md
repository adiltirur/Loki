## What is this
Loki is a Next.js 16 web application that integrates with the GitHub API via Octokit to provide some form of GitHub-oriented tooling or dashboard. It uses GitHub App authentication (`@octokit/auth-app`) and REST API access (`@octokit/rest`), with NextAuth v5 for user authentication. The exact domain purpose is not documented beyond the boilerplate README, but the dependency profile indicates it is a multi-locale, theme-aware GitHub App frontend.

## Architecture
- **Framework**: Next.js 16.2.3 (App Router) with React 19
- **Auth**: NextAuth v5 beta (`next-auth@5.0.0-beta.30`) — unstable API surface
- **GitHub integration**: `@octokit/rest` + `@octokit/auth-app` for GitHub App-authenticated API calls
- **UI**: Radix UI primitives (Dialog, DropdownMenu, Select, Slot, Tabs, Tooltip) + Tailwind CSS v4 + `lucide-react` icons; variants via `class-variance-authority`, merging via `tailwind-merge`/`clsx`
- **i18n**: `next-intl` v4
- **Theming**: `next-themes`
- **Styling pipeline**: Tailwind CSS v4 via `@tailwindcss/postcss` (PostCSS-based, not the v3 config model)
- **Language**: TypeScript 5, strict types expected

## Structure
- `app/` — Next.js App Router pages, layouts, route handlers (API routes live here as `route.ts` files)
- `components/` — Shared UI components built on Radix primitives
- `lib/` or `utils/` — Expected location for Octokit client setup, auth helpers, utility functions
- `messages/` or `locales/` — `next-intl` translation files (locale JSON)
- `public/` — Static assets
- `next.config.*` — Next.js configuration; likely includes `next-intl` plugin wiring

## Conventions
- **This is Next.js 16 App Router** — do not apply Pages Router patterns or pre-v15 App Router APIs. Before writing any Next.js code, consult `node_modules/next/dist/docs/` for current API signatures. Heed all deprecation notices.
- Use Server Components by default; mark Client Components explicitly with `"use client"` only when required (event handlers, hooks, browser APIs).
- Tailwind CSS v4 syntax — no `tailwind.config.js` in the traditional sense; configuration is PostCSS/CSS-native. Do not write v3-style config.
- NextAuth v5 beta API — session access, route protection, and provider config differ from v4. Do not assume v4 patterns.
- `next-intl` v4 — routing and config API differs from v3.

## What to watch for
- **NextAuth v5 is beta**: APIs are unstable; `auth()`, `signIn()`, `signOut()` signatures and middleware integration may differ from any training data. Verify against installed version.
- **GitHub App secrets**: `@octokit/auth-app` requires `appId`, `privateKey`, `installationId`. These must never appear in client-side code or be committed. Ensure all Octokit instantiation is server-side only.
- **React 19 + Next.js 16**: Async component patterns, `use()` hook, and concurrent features may be in use. Do not suggest patterns that regress to React 18 assumptions.
- **Tailwind v4 breaking changes**: No `theme.extend` in JS config; utility class names and plugin API changed. Flagging "missing tailwind config" is a false positive.
- **`next-intl` routing**: Middleware and `getRequestConfig` wiring is v4-specific; do not apply v3 `createMiddleware` patterns.
- **Server/Client boundary leakage**: Octokit and auth secrets must stay in Server Components or Route Handlers; never pass raw tokens to the client.
- **`lucide-react` v1**: Major version — icon names and import paths may differ from the widely-documented v0.x API.

## Accepted Patterns
_No accepted deviations from standard patterns have been explicitly documented for this repository._