# Project Guidance

## User Preferences

- Explain, visualize, and simulate the math rather than only describing it
- Keep the user's own framing and terminology: octave, integral level, love, transcendence, rank space
- Tie theory to the three home sites: spireason.neocities.org, laegna.notaku.site, github.com/tambetvali
- Prefer modest, coherent scope over attempting to finish everything
- Higher-order theory leveraged down to first order is the guiding development philosophy

## Verified Commands

- **typecheck**: `pnpm --dir app/src/frontend typecheck`
- **fix**: `pnpm --dir app/src/frontend fix`
- **build**: `pnpm --dir app/src/frontend build`

## Learnings

- This project uses the enhanced migration chain: migrations live in src/backend/migrations/YYYYMMDD_HHMMSS.mo exporting `public func migration(old : OldActor) : NewActor`; a legacy src/backend/migration.mo is dead code and fails with M0251.
- lib/notebook.mo needs `import Result "mo:core/Result"`; the compiler reports its absence as M0026 unbound variable Result.
- Motoko has no triple-quoted string literal; build multi-line Markdown by concatenating single-line literals with `#`. A top-level `let` in a mixin is stable state and traps at runtime, so return static strings directly from the function body.
- OQL Expose over a Map field uses MapEntity.toEntity(name, typeName, idField).sample(record).ownedBy("owner").controllerOrScoped().build(); schema() and execute() are emitted as query endpoints.
- Tailwind animation utilities must match the config key exactly (config key `fade-rise` yields `animate-fade-rise`); a mismatch fails silently. Tailwind cannot detect dynamically built class names like `text-octave-${i}` — map to a static class array.
- Biome rejects role='radio' on <button>; use a real <input type='radio'> inside a <label> in a <fieldset>/<legend>.
- When a dimension toggle must change a visualization, branch the rendered chart itself (heatmap vs line plot), not just the surrounding copy.
- Backend concept ids are octave, integral-level, love, transcendence, rank-space, projection, fourier, gaussian. Notebook order is a bigint index into the local order array. Backend timestamps are nanosecond bigints; convert via new Date(Number(ts / 1_000_000n)).
- Vitest + jsdom needs pointer-capture and scrollIntoView polyfills for Radix Select; vi.mock must be top-level (or use vi.hoisted) or the real module loads.
- The PocketIC lane decodes Candid variants as { ok } / { err }, not the TypeScript wrapper's __kind__ convention.
