# Folio CRM

Good relationships. Great work.

A frontend-only CRM with a reusable token system, a React component system, and a complete browser-local application. No database, API, authentication service, environment secrets, or backend setup is required.

## Run locally

Requires Node 22.13+ and npm.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. The workspace starts with realistic sample contacts, companies, deals, and tasks. Data is saved to localStorage on this browser and origin. The Alex Morgan profile is a demo identity.

## Build in order

The repository was implemented and committed bottom-up:

1. `packages/tokens` — semantic color, space, type, radius, elevation, motion, and layering tokens. JSON is the source; CSS variables are generated.
2. `packages/ui` — reusable React buttons, inputs, fields, selects, badges, avatars, cards, tabs, dialogs, empty states, and toasts. Components consume the token package and know nothing about CRM data.
3. `app` and `lib` — CRM screens and domain logic composed from the component system.

Use **Design system** in the app to explore tokens, component variants, interactive examples, and guidelines. Package READMEs document the system contracts.

## What works

- Overview with computed pipeline totals and due follow-ups.
- Contacts: create, edit, delete, search, filter, sort, notes, relationship details, and CSV export.
- Companies: create, edit, delete, relationship counts, and open pipeline totals.
- Deals: create, edit, delete, and move through six stages using keyboard-accessible selectors.
- Tasks: create, edit, delete, complete/reopen, search, and filter by due/completed state.
- Browser-local persistence, synchronization between tabs, and explicit storage failure feedback.
- Validated JSON backup/restore, sample-data reset, and clear workspace with confirmation.
- Responsive navigation, scrollable tables/boards, native modal focus management, and reduced-motion support.

## Deploy without any backend

```sh
npm run build
npm run preview
```

Publish `dist/` to any static host. Navigation uses URL hashes, so no server route rewrites are required.

## Validate

```sh
npm run tokens:build
npm run typecheck
npm run lint
npm test
npm run build
```

CI runs these checks and verifies generated token CSS is up to date. Tests cover backup validation, referential integrity, pipeline totals, CSV formula escaping, persistence across remounts, cross-tab updates, storage failure behavior, and form-control semantics.

## Data notes

Data is local to a browser and origin, not a user account. Export a JSON backup before clearing browser data, changing devices, or switching from local development to a deployed URL. This app has no multi-user synchronization. Simultaneous edits in multiple tabs use last-write-wins. Import replaces the whole workspace after confirmation and validates its schema and relationships first.

Sample company domains use `.example`. CSV exports escape formula prefixes. Deleting a contact/company unlinks related records instead of silently removing their deals or tasks.
