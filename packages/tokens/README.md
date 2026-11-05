# Folio design tokens

The single source of truth is `src/tokens.json`. It defines semantic color roles, spacing, typography, radii, shadows, motion, and stacking order. Components consume CSS custom properties rather than embedding palette values.

Edit JSON, run `npm run tokens:build` from the repository root, and commit both JSON and generated CSS. Import `@folio/tokens/css` once at the application root. Override semantic custom properties within a theme scope when introducing another theme.

Color roles: `brand` is the primary action; `canvas` the page; `surface` raised content; `subtle` quiet areas; `ink` and `muted` text; `border` separators. Status colors each have a foreground and soft background pair. Never use status color alone to communicate meaning.

Use the spacing scale for component padding and gaps. Focus rings use the focus color with a visible offset. Reduced motion is respected by the component stylesheet.
