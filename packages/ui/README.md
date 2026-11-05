# Folio component system

Framework: React 19. Import components from `@folio/ui` and its stylesheet from `@folio/ui/css`. All visual primitives consume `@folio/tokens`.

- **Button**: primary, secondary, ghost, danger; small and medium sizes; native disabled state. Defaults to `type="button"`; opt into submit explicitly.
- **Input / Select / Textarea / Field**: native HTML form semantics and validation. Field wraps its control in a label. Provide a unique accessible name for standalone inputs.
- **Badge**: neutral, success, warning, info, danger. Always includes text with its color indicator.
- **Avatar**: decorative initials; pair with a visible name.
- **Card / EmptyState**: layout surfaces and empty results with optional recovery action.
- **Tabs**: mutually exclusive view buttons using `aria-pressed`; all are keyboard reachable.
- **Modal**: native modal dialog, focus containment, Escape/backdrop dismissal, title association, focus restoration.
- **Toast**: polite live status feedback.

See the app's Design system page for live examples. Business data and CRM logic must stay outside this package. Build domain components by composing these primitives, rather than extending primitives with CRM-specific props.
