# Design Brief

## Direction

Instrument Panel for a Private Observatory — a dark-first mathematical theory lab where long-form essays, numeric tables, and inline plots share one calm scholarly surface.

## Tone

Refined editorial-scientific: quiet ink backgrounds, luminous numerals, serif theory headings — the restraint of a printed monograph, not the gloss of a SaaS dashboard.

## Differentiation

A perceptually ordered six-step "octave ramp" is a first-class token, so every level, order, and integral shift is color-encoded consistently across charts, badges, and tables — the palette itself teaches the theory.

## Color Palette

| Token      | OKLCH           | Role                                              |
| ---------- | --------------- | ------------------------------------------------- |
| background | 0.175 0.028 266 | Dark ink field (dark); parchment 0.965 0.012 82  |
| foreground | 0.92 0.012 262  | Essay body & headings; ink 0.235 0.022 262 (light) |
| card       | 0.215 0.032 266 | Computed-output panels, notebook entries          |
| primary    | 0.74 0.135 196  | Cyan-teal action & focus ring                     |
| accent     | 0.68 0.155 300  | Projection / metaphor violet                      |
| muted      | 0.255 0.032 266 | Recessed input surfaces, secondary text           |
| octave-0..5| 0.38→0.88 L ramp, H 268→168 | Ordered level/order encoding (6 steps) |
| concept-love / -frequency / -projection | 0.66 0.20 12 / 0.72 0.14 215 / 0.70 0.16 300 | Love-combination, spectral, metaphor accents |
| chart-1..5 | 0.68 0.16 268 / 0.72 0.14 215 / 0.66 0.20 12 / 0.70 0.16 300 / 0.70 0.15 152 | Chart series, light+dark legible |

## Typography

- Display: Fraunces — theory headings, essay titles, hero; wonk axis on for character
- Body: General Sans — UI labels, prose, controls
- Mono: JetBrains Mono — numeric readouts, tables, formulas, tabular figures
- Scale: hero `text-4xl md:text-6xl font-bold tracking-tight`, h2 `text-2xl md:text-3xl font-semibold`, label `text-xs font-semibold tracking-widest uppercase`, body `text-base md:text-lg leading-relaxed`, readout `text-sm readout`

## Elevation & Depth

Two deliberate surface classes carry the whole hierarchy: `.surface-input` is recessed with an inset shadow, `.surface-output` is raised with a soft ambient shadow — input and computed result never look alike.

## Structural Zones

| Zone    | Background        | Border          | Notes                                                        |
| ------- | ----------------- | --------------- | ------------------------------------------------------------ |
| Header  | `bg-card`         | `border-b`      | Sticky; wordmark in Fraunces, level selector chip in mono    |
| Sidebar | `bg-sidebar`      | `border-r`      | Concept index; active item uses `bg-sidebar-accent` + octave bar |
| Content | `bg-background`   | —               | Alternating `bg-muted/30` bands between theory sections      |
| Footer  | `bg-muted/40`     | `border-t`      | Home-site links (spireason, laegna.notaku.site, github) in mono |

## Spacing & Rhythm

Sections separated by `py-16 md:py-24`; content grouped in `gap-6`; micro-spacing `gap-2` inside readout rows and `gap-1` in table cells — generous around prose, tight around numbers.

## Component Patterns

- Buttons: `rounded-md`, primary = cyan-teal fill with `primary-foreground`; secondary = `bg-secondary` with border; hover shifts to `ring` at 30% and lifts 1px
- Cards: `rounded-lg surface-output`, no border-radius on inner table rows; essay cards use `rounded-md` with a 2px left octave-colored bar
- Badges: `rounded-sm` mono uppercase, octave badge background = matching `octave-N` at 18% with full-strength text
- Inputs/sliders: `rounded-md surface-input`, thumb uses `primary`, live value shown as `.readout` beside it

## Motion

- Entrance: content fades and rises 8px over 240ms ease-out, staggered 40ms per card
- Hover: 150ms color/border shift only; no scale on text
- Decorative: `octave-pulse` on the active level bar; `plot-draw` stroke-dash reveal on inline SVG plots

## Constraints

- Dark mode is the default; light mode is a true parchment inversion, never a grey wash
- No raw hex/rgb in components — semantic tokens and octave/concept tokens only
- Numeric data always renders in JetBrains Mono with `tabular-nums`
- Charts must use `chart-*` and octave tokens, never ad-hoc colors
- No permalinks or theory-sheet export (out of scope)

## Signature Detail

The octave ramp as a visible spine: a six-step color bar that recurs in the level selector, badges, chart strokes, and the sidebar active indicator, so the integral-level concept is legible at a glance without reading a legend.
