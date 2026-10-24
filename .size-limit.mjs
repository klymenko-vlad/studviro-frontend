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
    // still the single largest thing in the shared chunk.
    //
    // Taken before the password-reset screens landed, as it had to be: `shared/ui`'s
    // `Select` is now a native `<select>` (`src/shared/ui/select.tsx`), styled to match
    // the other form controls, across all six call sites (role granting, invite-person,
    // the schedule filters, the two institution-settings field groups, and the sync mode
    // picker). Dropping `@radix-ui/react-select` — and with it floating-ui, focus-scope,
    // dismissable-layer and the collection helpers it pulled in — took the measured
    // total from 453.45 kB to 425.84 kB, 27.61 kB back. The password-reset request and
    // confirm screens then spent some of that recovered room; measured at 431.47 kB with
    // both in place. Not lowering the limit itself: 455 kB stays the ceiling, now with
    // headroom again instead of against it.
    //
    // Raised from 455 kB to 480 kB for the grade-entry table, the notification
    // families, the feature-flag and terminology plumbing, and the enrolment
    // screen. Measured at 453.66 kB with all four in place — 1.34 kB of headroom,
    // which is not headroom.
    //
    // A reduction was looked for first, as the entries above insist. There was
    // none left to take:
    //   - The barrel-narrowing lever is spent: `apiQueries`, `apiSchemas` and the
    //     `sdk.gen` re-exports were all narrowed in earlier steps.
    //   - `@radix-ui/react-select` is already gone, swapped for a native
    //     `<select>`; that was the single largest item and it was taken, not
    //     deferred.
    //   - Nine Radix-backed primitives sit unused in `shared/ui` (checkbox,
    //     dialog, dropdown-menu, popover, scroll-area, sheet, tabs, tooltip,
    //     avatar) — but none is exported from `shared/ui/index.ts`, so none of
    //     them is in the bundle to begin with. Deleting the files would tidy the
    //     tree and recover nothing.
    // What is left is route code that four new screens genuinely need.
    //
    // The remaining known duplication, for whoever needs room next: `/enroll` and
    // `/exams` render the same card-and-reason shape twice, and
    // `EnrollableOfferingCard` repeats `ExamTermCard`'s window and seats logic.
    // One shared component would cover both. It is worth a step of its own rather
    // than a rushed extraction inside a feature step.
    // Lowered from 480 kB to 450 kB when the integration was removed (ADR 0024).
    // Deleting the sync monitor, connector status, reconciliation and write-intent
    // slices — four entities, four features, two widgets and a route — took the
    // measured total from 458.02 kB to 437.63 kB, 20.39 kB back. The guard is
    // lowered rather than left where it was, because a ceiling nothing approaches
    // stops being a ceiling.
    //
    // Raised from 450 kB to 540 kB for Phase 1 and Phase 2 of `Product Plan.md`
    // (see `backend/docs/`). N1 and N2 took the measured total from 437.63 kB to
    // 448.45 kB — 1.55 kB of headroom, with thirteen more registry and learning
    // screens to come at roughly 5 kB of route code each.
    //
    // The reduction this file's earlier entries reserved was taken first, and
    // measured: `/enroll` and `/exams` now share a `ListingCard` shell in
    // `shared/ui` instead of rendering the same Card-and-notes shape twice.
    // **It recovered nothing** — 448.45 kB before, 448.50 kB after. The
    // duplication was structural rather than byte-heavy, and gzip was already
    // collapsing the repeated markup. The extraction is kept because it is
    // better code, not because it bought room. Whoever needs room next should
    // not re-attempt it.
    //
    // That exhausts the levers this file has ever named: the barrels are
    // narrowed, `@radix-ui/react-select` is gone, the unused primitives were
    // never exported. What is left in the two largest chunks is the React and
    // Next runtime, which no amount of application work moves.
    //
    // This budget globs every chunk, so it is total app JS: an app deliberately
    // gaining fifteen routes cannot hold a fixed number, and a ceiling that has
    // to be raised every step is not measuring anything. 540 kB was set once, for
    // the whole of Phase 1 and Phase 2, to be lowered back to whatever the app
    // measured when that work landed — the way it was lowered to 450 kB when the
    // integration came out.
    //
    // **That lowering was attempted and is void.** It was written down when the
    // app measured 506 kB against this 540 kB ceiling, leaving 34 kB to give
    // back. By the time it was taken the app measured **539.88 kB** — the
    // interface pass that went through every screen (the account menu, the
    // single-column theme and language rows, a placeholder on every field) spent
    // the whole of that headroom and came to rest 0.12 kB under the ceiling.
    // There was nothing left to reclaim. Nothing was reverted to make room: that
    // work is wanted, and a guard exists to make its cost visible, not to veto it.
    //
    // Raised to 555 kB for the person typeahead and the per-offering authoring
    // gate. Measured at **546.74 kB**, +6.86 kB over the 539.88 kB baseline. The
    // picker is deliberately hand-built from `Input` and a listbox rather than
    // adopting `cmdk` or the vendored `popover`: adopting either would put it in
    // this barrel and so on every route, which is what the header of
    // `shared/ui/index.ts` warns about, and would cost more than the component.
    //
    // A reduction was looked for first, as every entry above insists, and there
    // was none: the barrels are narrowed, `@radix-ui/react-select` is long gone,
    // the unused Radix primitives were never exported, and the `ListingCard`
    // extraction this file reserved was taken and measured at zero bytes. What is
    // left in the two largest chunks is the React and Next runtime.
    //
    // 8.26 kB of headroom. That is thin, and the next person to need room should
    // expect to find it by shipping less rather than by narrowing anything.
    //
    // The captcha then spent 5.18 kB of it — measured at **552.05 kB**, still
    // under the ceiling, which is why this number is unchanged. Two things it
    // cost more than that before they were fixed, both worth knowing:
    //
    //   - Reading the captcha state with `useQuery` added **13.6 kB**. The
    //     three auth routes had no client query at all, so the first one pulled
    //     React Query's observer machinery into their chunks. Whether a
    //     deployment asks for a captcha is fixed at deploy, so it is read on the
    //     server and passed as a prop instead — cheaper *and* the right shape.
    //   - Importing that server read through `entities/captcha`'s public API
    //     added **19 kB**, because the barrel also re-exports two `'use client'`
    //     modules and a Server Component importing it drags both into the
    //     client graph. It lives in `shared/auth` beside `getCurrentUser` now.
    //     **This is a general trap**: any server-only read added to a slice
    //     whose barrel exports client code will do the same thing.
    //
    // The solver itself is hand-written against ALTCHA's protocol rather than
    // adopting the `altcha` web component, for the reason the typeahead above
    // gives: at ~12 kB gzipped the widget alone would have breached this.
    //
    // Raised from 555 kB to 565 kB when the dashboard stopped being a student's
    // dashboard for everybody. It is now built from the roles a person holds: an
    // administrator gets the running term and shortcuts to the screens they run,
    // a teacher gets the courses they teach, a student keeps their four tiles.
    // Measured at **558.04 kB** against a 551.1 kB baseline, +6.94 kB. Of that,
    // 1.6 kB is the nine `lucide-react` icons on the administration shortcuts and
    // the teaching rows — measured by building without them, at 556.43 kB, which
    // still breaches 555 kB. The icons were kept: dropping them alone does not
    // make room, and a grid of eight text-only links is markedly harder to scan.
    // The rest is two new tiles and the composition; no dependency, no new
    // `shared/ui` primitive.
    //
    // Raised from 565 kB to 580 kB for account settings and two-step
    // verification: a settings page with profile, password, authenticator and
    // session cards, and a second step on `/sign-in`. Measured at **576.16 kB**
    // against a 560.45 kB baseline, +15.71 kB: 9.3 kB is the settings route, about
    // 1.4 kB the code step on the sign-in route, the rest generated schemas and
    // shared chunks. `next/image` for the QR code cost another 5.68 kB and was
    // dropped; the code is a data URL, so an SVG `<image>` shows it for nothing.
    //
    // Raised from 580 kB to 595 kB on 2026-10-18 for three student features, of
    // which the first two fitted under the old ceiling and the third did not:
    // the calendar subscription card (+2.19 kB), times on the institution's own
    // clock (+0.83 kB), and the course discussion (+5.76 kB: thread list, thread
    // view, the two forms, moderation buttons and their generated schemas).
    // Measured at **585.04 kB**. The discussion adds no dependency and no
    // `shared/ui` primitive; lazy-loading its tab would move bytes between
    // chunks this glob already sums, not remove them. About 10 kB of headroom.
    //
    // Raised from 595 kB to 605 kB on 2026-10-22 at the product owner's request
    // for an interface pass: notification and card links that open the item
    // (+0.8 kB), whole-card links and the motion layer (class strings only — the
    // animations themselves are CSS), the phone tab bar, and search that starts
    // from the person's own courses and history (the enrolled and teaching
    // queries now also load on `/search`, so their schemas count twice in this
    // sum). Measured at **601.69 kB**. No dependency added. About 3 kB of
    // headroom: the next step that adds client code must make room first.
    //
    // Raised from 605 kB to 615 kB on 2026-10-22 at the product owner's request
    // for course sections (Course Builder Plan CB1): the outline that replaces
    // the flat materials list, section add/edit/move/hide/remove, per-item move
    // and section picker, and their generated schemas. Measured at
    // **608.45 kB**. The old list and its move buttons were deleted, not kept
    // beside the outline, and the section picker is the native `Select`. No
    // dependency added. The plan's quiz steps (CB6–CB8) will need room of their
    // own; budget for them when they land, do not pre-spend it.
    //
    // Raised from 615 kB to 620 kB on 2026-10-23 for completion and progress
    // (Course Builder Plan CB3): the student's tick or status on each item, the
    // course and section progress bars, the completion rule on the material and
    // assignment forms and in the outline, the teacher's completion table, and
    // their generated schemas. CB2 measured 611.39 kB; this measures
    // **618.03 kB**, +6.64 kB. No dependency added; the table reuses `Table`,
    // `LoadMore` and the native `Select`.
    //
    // Raised from 620 kB to 625 kB on 2026-10-23 for restrict access (Course
    // Builder Plan CB4): the restriction editor on sections, materials and
    // assignments (conditions, one level of grouping, all/any, hide while locked),
    // the locked note for students and the author's badge, and their generated
    // schemas. Measured at **624.4 kB**, +6.4 kB over CB3's 618.03 kB. About a third
    // is generated Zod: the SDK validates responses, so the restriction view schema
    // rides on every material, assignment and section read, and the input schema on
    // every create and update. Lazy-loading the editor would not move this number,
    // since the budget sums every chunk. The editor uses plain state and the native
    // `Select` rather than react-hook-form, and adds no dependency.
    //
    // Raised from 625 kB to 632 kB on 2026-10-23 for content for one group
    // (Course Builder Plan CB9): the Groups control on every section and item,
    // the "who can see this" table with its filter and Load more, the group
    // badge and sentence, the roster's per-group content list, and their
    // generated schemas (the audience view now rides on every outline read).
    // Measured at **630.48 kB**, +6.08 kB over CB4. The group picker reuses
    // `Switch` and the native `Select` rather than adding a checkbox or radio
    // primitive, and no dependency was added.
    //
    // Raised from 632 kB to 634 kB on 2026-10-23 for view as a student (Course
    // Builder Plan CB11): the switch and banner on the Content tab, the paged and
    // filtered student picker, the read-only outline, and their generated client
    // (a request and response schema that reuse the outline's). Measured at
    // **633.3 kB**, +2.82 kB over CB9. The preview renders the same outline
    // components with a read-only flag rather than a second copy of them, and
    // adds no dependency and no primitive; there was nothing left to cut that
    // the feature does not use.
    //
    // Raised from 634 kB to 638 kB on 2026-10-24 for more things to put on a
    // page (Course Builder Plan CB5): the page, label, video and folder kinds in
    // the add form, an edit form for a material's title and content, the folder's
    // paged and filtered file list with its add and remove actions, the video
    // frame, and their generated client. Measured at **637.38 kB**, +4.08 kB over
    // CB11. The Markdown renderer is not in that number: a page is rendered by a
    // Server Component on its own route, and the form's preview by a Server
    // Action, so the renderer never ships to the browser. No dependency added.
    //
    // Raised from 638 kB to 677 kB on 2026-10-24 for quiz authoring and the
    // question bank (Course Builder Plan CB6, ADR 0050). Measured at
    // **675.76 kB**, +38.38 kB over CB5's 637.38 kB — the largest single raise
    // in this file, because the step adds two client-heavy routes of their own
    // rather than a panel on an existing one. Measured piece by piece in a clean
    // worktree of the CB5 commit:
    //   - the regenerated client (quiz, slot and question schemas; the quiz rides
    //     on the student view): +2.2 kB;
    //   - the quiz row, the Add quiz form, quizzes in moves, restrictions and the
    //     student view on the course page: about +4 kB;
    //   - the question bank route (categories, the paged question list, one
    //     editor that switches on seven types): +16 kB, of which 11.4 kB is its
    //     own route chunk;
    //   - the quiz editor route (the settings form, the paged question list with
    //     marks and moves, adding by hand from the bank or drawn at random):
    //     +16.3 kB.
    // The full settings form was first also on the course page; moving it to
    // the quiz's own route (adding a quiz on the course page is now a name only)
    // was measured and bought nothing, since the route needs the form anyway —
    // it is kept because it is the better flow. The route chunks are the
    // features' own code, not duplicated libraries. No dependency and no `shared/ui` primitive
    // was added; the type editors use plain state and the native `Select` and
    // `Switch`, as the restriction editor does. CB7 (taking a quiz) will need
    // room of its own.
    //
    // Raised from 677 kB to 693 kB on 2026-10-24 for taking a quiz (Course
    // Builder Plan CB7). Measured at **692.02 kB**, +16.26 kB over CB6's
    // 675.76 kB, against a clean build of the CB6 commit chunk by chunk:
    //   - the attempt route (questions of seven types, the timer, the question
    //     navigator, autosave, the submit check and the end state): +10.4 kB, its
    //     own route chunk;
    //   - Start / Continue and the student's paged attempts on the quiz row:
    //     about +1.2 kB on the course page;
    //   - the authors' paged, filtered attempts table on the quiz page: +1.3 kB;
    //   - the regenerated client (attempt, answer and list schemas): +1 kB;
    //   - the shared chunk (the native `Choice` radio/checkbox primitive and the
    //     shared date formatter): +1.6 kB.
    // The first build cost +26.7 kB: the course page imported the start button
    // through the same barrel as the attempt runner and so shipped the runner
    // too. Splitting `start-quiz` from `take-quiz` took 10.4 kB back. No
    // dependency was added: choices are native inputs in a new `Choice`
    // primitive rather than Radix radio group and checkbox, matching uses the
    // native `Select`, and the submit check is an inline panel, not a dialog.
    //
    // Raised from 693 kB to 703 kB on 2026-10-24 for quiz review and marking
    // (Course Builder Plan CB8, ADR 0052). Measured at **702.8 kB**, +10.78 kB
    // over CB7's 692.02 kB, building the CB7 commit and then adding the step a
    // slice at a time:
    //   - the regenerated client (review, marking, regrade and results schemas;
    //     the review options ride on every quiz read): +1.13 kB;
    //   - the review options in the quiz settings form: +0.84 kB;
    //   - the student's review on the attempt route, which reuses CB7's question
    //     fields read-only, and the mark and _Review_ link on the quiz row:
    //     +3.72 kB;
    //   - the needs-marking filter and _Mark_ links, the regrade panel with its
    //     preview and the results-by-question table on the quiz page: +2.4 kB;
    //   - the marking screen: +2.69 kB.
    // The marking screen first had a route of its own and cost +6.98 kB there:
    // a new route chunk repeats the page shell, the trail and the quiz entity.
    // It now lives on the attempt's own route, which opens as the marking
    // screen for the course's authors; that took 4.29 kB back. The regrade
    // confirmation is an inline panel rather than a dialog, the marking form
    // uses plain state rather than react-hook-form, and no dependency or
    // `shared/ui` primitive was added.
    name: 'All client JS (every route)',
    path: '.next/static/chunks/**/*.js',
    limit: '703 kB',
    gzip: true,
  },
];

export default budgets;
