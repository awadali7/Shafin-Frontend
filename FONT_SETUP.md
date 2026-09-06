# Font Setup

## Fonts Configured

1. **Bricolage Grotesque** - Used for all headings (h1-h6)
2. **IBM Plex Sans** - Used for body text, lists, links, and form controls

Both are loaded via `next/font/google` in `app/layout.tsx` - no manual font files needed.

IBM Plex Sans was chosen over a generic sans (previously Inter, before that an
unfinished plan to use a custom "Onset Regular" font) for its technical/engineered
feel, which matches the diagnostic-tools brand, and its clean alphanumeric
rendering for product/part codes (e.g. "DP032626").

## Current Font Usage

- **Headings** (`h1`-`h6`): Bricolage Grotesque (`--font-heading`)
- **Body text** (`p`, `li`, `a`, `span`, `div`, `button`, `input`, `textarea`,
  `select`, `label`): IBM Plex Sans (`--font-body`)

Fallback stack for both: `Arial, Helvetica, sans-serif` (see `app/globals.css`).
