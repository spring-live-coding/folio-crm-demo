# Architecture

Dependency direction is deliberate:

`tokens.json → generated CSS variables → @folio/ui → CRM compositions`

The npm workspace packages are consumed directly as source by Vite. This keeps the demo easy to inspect without maintaining a separate library publishing pipeline. Components can be extracted and published later without moving CRM logic into them.

`lib/model.ts` owns domain types, referential deletion behavior, backup validation, export, and value/date formatting. `lib/seed.ts` supplies fictional records with relative follow-up dates. `lib/use-crm.ts` hydrates localStorage after mount and saves explicit mutations; corrupted data is not overwritten on startup. Storage failure leaves the current session editable and offers backup download.

`app/record-form.tsx` composes native controls with shared primitives. `app/page.tsx` provides the workspace and views. `app/design-system.tsx` is an interactive catalog. No CRM state is sent over a network.

Native `<dialog>` provides modal focus containment and Escape behavior. Native HTML form controls provide keyboard interaction and validation. Dialog dismissal restores the initiating focus. Status messages are announced politely; errors use alert semantics. Color indicators are always accompanied by text.

Schema version 1 is intentionally explicit. Future migrations should read older versions and migrate before committing browser storage; do not simply change the version and drop user records.
