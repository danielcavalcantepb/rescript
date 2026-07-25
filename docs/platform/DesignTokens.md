# Design Tokens

Source: `apps/web/src/styles.css` (`@theme`).

## Groups

- Color (primary, canvas, surface, semantic)
- Spacing (`--space-*`)
- Radius (`--radius-*`)
- Elevation (`--shadow-*`)
- Opacity (`--opacity-*`)
- Z-index (`--z-*`)
- Motion (`--motion-*`, `--ease-*`)
- Typography (`--text-*`, fonts)
- Breakpoints (`--breakpoint-*`)

Components consume `var(--…)` — avoid hardcoded hex/px in feature UI.
