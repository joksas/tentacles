# CLAUDE.md

See README.md for project overview and package.json for available pnpm commands.

## Stack

- **Package management**: pnpm
- **Framework**: React 19 + TanStack Start
- **UI**: HeroUI v3 + recharts + Tailwind CSS v4 + Phosphor icons
- **API**: Octopus Energy API
- **Validation**: Zod v4 and TanStack Form
- **Deployment**: Cloudflare Workers via Wrangler
- **Linter/formatter**: Biome

## File organization

- public/: static assets
- src/styles.css: Tailwind CSS v4 file
- src/router.tsx: router
- src/routes/: routes
- src/components/: components (see src/components/CLAUDE.md)
- src/lib/: library functions (see src/lib/CLAUDE.md)
- src/services/octopus/: Octopus API (see src/services/octopus/CLAUDE.md)
- cron/: Cloudflare Worker cron job that claims free Octopus coffee offers daily (04:30–08:00 UTC, every 15 min)
