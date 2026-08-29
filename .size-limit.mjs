/**
 * Bundle budgets, enforced by `pnpm size` (and so by `pnpm verify`).
 *
 * A `.mjs` config rather than JSON because the reasoning behind each limit is
 * the useful part, and JSON has nowhere to put it — size-limit rejects an
 * unknown `comment` key outright.
 *
 * There is deliberately only one entry. Per-chunk budgets were previously
 * written against webpack's `framework-*.js` / `app/layout-*.js` names, which
 * Turbopack does not emit — it emits content-hashed names like
 * `0r-ed9k6939g6.js`, so no stable glob can name "the framework chunk". Those
 * entries silently matched nothing and reported no size at all, which is worse
 * than not having them. Splitting this budget up again means finding a handle
 * on Turbopack's output that survives a rebuild.
 */
const budgets = [
  {
    // The aggregate ceiling for everything the browser can be asked to load.
    //
    // Note this globs every chunk, not a per-route entry: it is total app JS, so
    // code-splitting a route behind `dynamic()` does not move this number. Only
    // shipping less code does.
    //
    // Raised from 310 kB when the sign-in flow landed: `/sign-in` is the first
    // route to ship a form, so react-hook-form, the Zod resolver and the shadcn
    // `Form` primitives entered the client bundle for the first time. Measured
    // at 319.89 kB with that in place.
    //
    // Raised again from 330 kB for the role administration, institution settings
    // and account screens. Measured at 401.37 kB. The shared chunk accounts for
    // +32.7 kB of that on its own, and it is almost entirely `@radix-ui/react-select`
    // and `react-switch` — Select drags in floating-ui, focus-scope, dismissable-layer
    // and the collection helpers, and this is the first release to use it. The
    // remainder is the new route code itself. No new dependency was added.
    //
    // Verified this is not barrel bloat before raising: narrowing the generated
    // Zod namespace re-export in `shared/api` to only the schemas actually used
    // recovered 2.2 kB, so the generated SDK is already being shaken.
    //
    // Raised again from 420 kB for the grades screen and the result panel on the
    // course page. Measured at 424.19 kB, up 13.15 kB. No new dependency: the
    // whole increase is the new route, the `course-result` entity and its card,
    // which renders every grade kind and its provenance rather than one mark.
    //
    // Raised again from 435 kB for the synchronization monitoring screen.
    // Measured at 436.83 kB. The screen adds a route, the `sync-run` entity, a
    // start-run action and three tables (freshness, per-domain run results, run
    // history); it introduced no dependency and no new `shared/ui` primitive.
    //
    // Three reductions were taken before raising this, not after:
    //   - `apiSchemas` narrowed from `export * as` to the three schemas forms
    //     actually use, so the other 105 generated Zod schemas stop being pinned.
    //   - `apiQueries` narrowed the same way, from the whole generated query
    //     namespace to the 39 operations slices call.
    //   - The `sdk.gen` class re-exports dropped; nothing imported them.
    // Together those recovered 1.25 kB from the step's own footprint.
    //
    // Raised again from 440 kB for the student dashboard, step 38. Measured at
    // 448.86 kB. The dashboard composes the existing `enrolled-course` and
    // `course-result` entities into two tiles on a new route; it added no
    // dependency and no new `shared/ui` primitive, so the increase is the route
    // chunk itself.
    //
    // This is the second raise in one session and it is one too many. The
    // barrel-narrowing lever is spent — what is left is `@radix-ui/react-select`,
    // still the single largest thing in the shared chunk, reachable only by
    // replacing the primitive with a native `<select>` across its four call
    // sites (role granting, the two institution-settings field groups, and the
    // sync mode picker). That is a UI change to three already-shipped screens
    // and their tests, which is why it is its own backlog step rather than a
    // rider on this one. Take it before raising this number again.
    name: 'All client JS (every route)',
    path: '.next/static/chunks/**/*.js',
    limit: '455 kB',
    gzip: true,
  },
];

export default budgets;
