# Accessibility

A WCAG 2.2 AA conformance pass over every screen the client renders, plus the mobile-first
review that goes with it (backlog **U4**, **U5**, **O9**). Written 2026-09-19.

This is a record of what was checked, what failed, against which success criterion, and what
was done about it. It is not a style guide. Where a defect appeared twice it was fixed in
`src/shared/ui`, once.

## Scope

Every route the app serves:

`/` · `/sign-in` · `/sign-up` · `/forgot-password` · `/reset-password` · `/contact` ·
`/for-students` · `/for-teachers` · `/for-institutions` · `/account` · `/institutions/new` ·
and under `/institutions/[institutionId]`: dashboard, `courses`, `courses/[offeringId]`,
`enroll`, `teaching`, `grades`, `calendar`, `exams`, `notifications`, `learning`, `roles`,
`org-units`, `people`, `catalogue`, `programs/[programId]`, `bulk`, `settings`.

## Method

| What                         | How                                                                                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colour contrast              | Every token pair in `src/app/globals.css` converted OKLCH → sRGB and put through the WCAG relative-luminance formula, in **both** themes, including alpha compositing over the surface behind it. |
| Structure, names, roles      | `axe-core` (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `best-practice`) over 26 rendered screens and widgets.                                                                        |
| Keyboard, focus, target size | Read of every interactive primitive; measured in a real Chrome at 375 × 812.                                                                                                                      |
| Mobile                       | Real Chrome at 375 px, light and dark, measuring `scrollWidth` against the viewport on every screen that renders a table.                                                                         |

`axe-core` cannot check contrast under jsdom — it computes no layout, so `color-contrast`
only ever returns _incomplete_. The rule is **disabled in the test helper and replaced by the
token arithmetic below**, not silenced to make something pass.

---

## 1.4.3 Contrast (Minimum) — text, 4.5:1

Measured against the surface each colour is actually painted on.

### Failures found

| Pair                                             | Theme | Measured   | Required | Where                                                     |
| ------------------------------------------------ | ----- | ---------- | -------- | --------------------------------------------------------- |
| `--success-foreground` on `--success`            | light | **2.93:1** | 4.5:1    | the `success` token pair, e.g. a status badge             |
| `--success` as text on `--background` / `--card` | light | **3.01:1** | 4.5:1    | `text-success`                                            |
| `text-destructive/90` on `--card`                | light | **4.24:1** | 4.5:1    | `AlertDescription` inside `<Alert variant="destructive">` |
| `--warning` as text on `--background` / `--card` | light | **2.25:1** | 4.5:1    | `text-warning`                                            |

### Fixed

- `--success` light-mode darkened `oklch(0.65 0.17 150)` → `oklch(0.54 0.17 150)`. White
  foreground on it is now **4.60:1**, and it is **4.60:1** as text on white. Dark mode
  already passed (7.86:1 / 7.86:1) and is unchanged.
- `alert.tsx`: the destructive description dropped from `text-destructive/90` to
  `text-destructive`, taking light mode from 4.24:1 to **4.76:1** and dark from 4.64:1 to
  **5.20:1**.

### Deferred, with the reason

- **`--warning` cannot satisfy both directions.** Its job is a badge background carrying
  `--warning-foreground` (a dark ink), which it does at **7.88:1** light / 10.43:1 dark. To
  reach 4.5:1 as a _text_ colour on white it would have to drop to roughly `L 0.50`, at which
  point the dark ink on it falls under 4.5:1. `text-warning` is therefore **not a legal
  utility in light mode**; today nothing in `src/` uses it, and neither `text-success` nor
  `bg-warning` has a single call site either. If a status colour is ever needed as text,
  add a separate `--warning-text` token rather than reusing this one.

### Passing, recorded so the next change can be compared against it

Light: body 19.67:1 · muted text on page 5.51:1 · on `--muted` 5.05:1 · primary button
4.90:1 · destructive button 4.76:1 · link `--primary` on page 5.05:1 · `--foreground` on
`--accent` (table hover) 17.51:1 · muted on `--accent` 4.91:1.

Dark: body 18.04:1 · muted on page 7.36:1 · on card 6.91:1 · primary button 5.92:1 ·
destructive alert text 5.20:1 · link on card 5.56:1 · `text-white` on
`dark:bg-destructive/60` 7.55:1 (the raw `--destructive` at full strength would be 3.56:1 in
dark, which is why the `/60` override in `button.tsx` and `badge.tsx` has to stay — noted
here because removing it looks harmless).

## 1.4.11 Non-text Contrast — UI components, 3:1

### Failures found

| Token     | Theme | Measured          | Required | Consequence                                                                                                |
| --------- | ----- | ----------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `--input` | light | **1.27:1**        | 3:1      | the boundary that identifies an `Input`, `Textarea`, `Select`, `Checkbox` and the unchecked `Switch` track |
| `--input` | dark  | **1.54 / 1.61:1** | 3:1      | same, on `--background` and on `--card`                                                                    |

### Fixed

- `--input` light `oklch(0.92 0.005 265)` → `oklch(0.65 0.012 265)` — **3.24:1**.
- `--input` dark `oklch(1 0 0 / 16%)` → `oklch(1 0 0 / 38%)` — **3.5:1** on both the page
  and a card.

`--border` was deliberately **left alone** at 1.27:1 / 1.34:1. It separates decorative
surfaces — a card edge, a row rule, a section divider — which 1.4.11 does not cover. Splitting
the two is the point of having two tokens; darkening `--border` to match would be a redesign,
not a conformance fix.

### Passing

`--ring` against the page is 5.05:1 light / 5.92:1 dark, comfortably over the 3:1 a focus
indicator needs.

## 1.4.1 Use of Colour

No failures. Every place colour carries meaning also carries text: a `Badge` always has a
label, a dimmed card (`opacity-70`) always sits beside a state badge, and the annulled /
retake / overdue states are words before they are colours.

## 1.3.1 Info and Relationships

### Failures found and fixed

- **Card titles were `<div>`s.** `CardTitle` is used 37 times and is visually the heading of
  its section on every one of them; none of it was in the accessibility tree. `CardTitle` now
  renders a real heading — `h2` by default, with `as="h3"` for a card nested under a section
  that already has an `h2` (`FeatureGrid`, `AudienceCards`, `CourseResultCard`,
  `EnrolledCourseCard`, `TeachingOfferingCard`).
- **No table had a `<caption>`.** All 13 do now: `Table` takes a required `label` prop which
  is rendered as a visually-hidden `<caption>` and also names the scroll region.
- **Bulk entry's column hint was orphaned.** `#bulk-text-columns` is now wired to the textarea
  with `aria-describedby`.

## 2.4.1 Bypass Blocks

**Failed.** There was no skip link and no way past the site header plus a fifteen-item
institution navigation — 20-odd tab stops before the content of every signed-in screen.

**Fixed.** A skip link is the first focusable element in `app/layout.tsx`; it is `sr-only`
until focused, then fixed at the top left at 188 × 38 px with the global focus ring. Every
`<main>` in the app carries `id="main-content"` (31 elements, one rendered at a time).

## 2.4.6 / 1.3.1 Heading hierarchy

Checked per screen. Two skips found, both now correct:

- `/notifications`: `h1` → `NotificationCard`'s `h3`. The card heading is now `h2`; it has
  exactly one call site and sits directly under the page heading.
- `/enroll`: `h1` → `ListingCard`'s `h3`. `ListingCard` takes a `headingLevel`, still `h3` by
  default (the exam cards live under a term section's `h2`), and `EnrollableOfferingCard`
  passes `h2`.

Verified live: `/institutions/:id/catalogue` now reads `h1 Catalogue → h2 Academic terms →
h2 Programmes → h2 Courses → h2 Course offerings`.

## 1.3.1 / 2.4.1 Landmarks

Already correct and left alone: one `<main>` per screen, `<header>` as the banner (the
`<header>` elements inside views are scoped to `<main>` and so are not banners), `<nav>` with
`aria-label` on both the marketing and institution navigations, `<footer>` on the public
pages. `aria-current="page"` is on the active institution tab.

## 2.1.1 Keyboard / axe `scrollable-region-focusable`

**Failed.** `Table` has always wrapped itself in `overflow-x-auto`, and on a phone every
table overflows. The container was not focusable, so a keyboard-only user could not scroll it
and could not reach the columns to the right — the data was simply unreachable.

**Fixed** at the primitive: the container is `role="region"`, `tabIndex={0}`, named by
`label`, with a visible `focus-visible` ring. It is focusable at every width rather than only
when it overflows, because deciding that needs a layout measurement in render; the cost is one
extra tab stop per table, which is the smaller of the two problems.

`jsx-a11y/no-noninteractive-tabindex` rejects this by default. The rule was **re-configured,
not disabled** — `region` was added to its `roles` allowlist in `eslint.config.mjs`, beside
the `tabpanel` it already allows, with the reasoning inline.

## 2.4.7 Focus Visible

No failures. `:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px }` is a
global base rule and nothing in `src/` removes an outline without replacing it — the three
`outline-none` uses in `button.tsx`, `input.tsx` and `password-input.tsx` all pair it with a
3 px `focus-visible:ring`. The one to watch is `AudienceCards`, where the link's own outline
is suppressed and replaced by `focus-within:border-ring` on the whole card (5.56:1 against the
card); it is visible and it passes, but it is the weakest indicator in the app.

## 2.5.8 Target Size (Minimum) — 24 × 24

| Control                        | Measured    | Verdict                                            |
| ------------------------------ | ----------- | -------------------------------------------------- |
| `Button` default / `lg`        | 36 / 40 px  | pass                                               |
| `Button size="sm"` / `icon-sm` | 32 px       | pass                                               |
| `Button size="xs"` / `icon-xs` | 24 px       | pass, exactly — no call sites today                |
| Institution nav tab            | 32 px       | pass                                               |
| **`Switch` (default)**         | **18.4 px** | **fail** — 6 call sites                            |
| Skip link (before fix)         | 22 px       | **fail** — `not-sr-only` was resetting the padding |

**Fixed.** `Switch` gained a transparent `::before` that extends the pointer target to the
full 24 px height without changing a pixel of what is drawn. The skip link's padding moved
into the `focus-visible:` variant so it survives `not-sr-only`; measured at 188 × 38 px.

`Checkbox` is 16 px and would fail, but it has no call sites — it is vendored, not adopted.
Left as it is, with this note.

## 3.3.1 / 3.3.2 / 4.1.2 Forms

No failures. The `Form` primitive was already doing this properly and it is worth writing down
so it is not undone: `FormControl` sets `id`, `aria-invalid` and an `aria-describedby` that
gains the message id only when there is an error; `FormMessage` carries `role="alert"` (a
marked local deviation from upstream shadcn); `FormLabel` is bound by `htmlFor`.

Spot-checked across all 20 forms: `autoComplete` is set on every field including
`autoComplete="off"` where a password manager should stay out, `type="email"` and
`inputMode="numeric"` where they apply, submit buttons are enabled until the request starts,
and nothing blocks paste. The `/contact` honeypot is `sr-only` + `aria-hidden` + `tabIndex={-1}`,
so it is out of the tree _and_ out of the tab order.

**Deferred:** focus is not moved to the first invalid field on submit. WCAG does not require
it — 3.3.1 asks that the error be identified in text, which `FormMessage` does — so this is a
quality improvement, not a violation, and it is a change to every form at once.

## 4.1.3 Status Messages

- **Toasts** — already correct. `sonner` renders its own `aria-live` region; nothing to add.
- **Loading** — `Skeleton` was a silent box. Every screen in the app opens on one, so a
  screen-reader user heard nothing at all between navigation and data. It is now
  `role="status"` named by `common.loading`.
- **Bulk import** — the dry-run result appeared with no announcement. It is now inside a
  permanently-rendered `aria-live="polite"` wrapper (rendered empty rather than mounted with
  its content, which would not be announced).

## Dark mode

- **`color-scheme` was never declared.** Native scrollbars, date pickers and the native
  `<select>` popup — `shared/ui/select.tsx` is a real `<select>`, chosen for bundle size —
  rendered in light chrome over a dark page. `color-scheme: light` / `dark` added to `:root`
  and `.dark`.
- `<meta name="theme-color">` was missing. Added as a `viewport` export keyed on
  `prefers-color-scheme`, which is the only signal that meta tag can read; the cookie-set
  `.dark` class still wins inside the document.

Both themes were walked in a real browser. Every contrast number above is stated for both.

## Automated coverage (O9)

`src/shared/test/axe.tsx`, exported through `@/shared/test`:

```ts
renderAndAudit(ui, settle?)          // render with the app's providers, wait, audit
expectNoAxeViolations(element, opts?) // audit any subtree
```

`renderAndAudit` takes an optional `settle` assertion because every screen here opens on a
skeleton — auditing the first paint would audit the loading state. Failures report the rule
id, its impact and the offending selectors, not a count:

```
[critical] button-name: Buttons must have discernible text
    button
[moderate] heading-order: Heading levels should only increase by one
    h3
```

One test per screen shape, each a real assertion (verified by feeding the helper a deliberately
broken tree and watching it fail):

| Shape          | Test                                                                 |
| -------------- | -------------------------------------------------------------------- |
| Public landing | `views/home/ui/home-view.test.tsx`                                   |
| Form           | `views/contact/ui/contact-view.test.tsx`                             |
| Table          | `views/institution-catalogue/ui/institution-catalogue-view.test.tsx` |
| Dashboard      | `views/institution-dashboard/ui/institution-dashboard-view.test.tsx` |

The next screen gets one for free — a one-line `await renderAndAudit(<TheView … />, settle)`.

During the pass the same helper was run over a further 22 screens and widgets (grades,
courses, exams, calendar, notifications, teaching, enrol, roles, settings, learning, bulk,
programme, offering, create-institution, the audience landings, the header in both states,
the people and role tables, the password forms). All clean after the fixes above. Those
throwaway sweeps were not kept — they are a lint, not a spec.

---

## Mobile-first review (U5) — 375 px

Measured in Chrome at 375 × 812, signed in as an institution administrator, both themes.

**No screen overflows the viewport.** `document.scrollWidth` is 360–375 px on every route,
including the five that render tables.

### The tables

13 tables across 9 widgets, up to 8 columns wide. At 375 px the content column inside a card
is 262 px and the widest table wants 860 px.

A stacked card layout was considered and rejected: these are dense comparison tables — a grade
ladder, a roster, a programme roll — where the point is reading down a column, and stacking
destroys exactly that. Horizontal scroll with a real affordance keeps the table a table.

What was done, all at the primitive:

1. **A visible affordance.** `scroll-affordance-x` in `globals.css`: two `local` gradients
   that mask the content at each edge and two `scroll` shadows fixed to the box, so a shadow
   appears on precisely the edge that still has content behind it. Pure CSS, no measurement,
   no JavaScript, defined for both themes.
2. **Keyboard reach**, as above — the region is focusable and named.
3. **A caption**, so the table announces what it is before its columns.

Measured after the change, at 375 px: catalogue `262/860`, `262/290`, `262/486`, `262/765`;
roles `262/776`; people `262/649`. All scroll, all show the affordance, all reachable by
keyboard.

### Judged acceptable, and why

- **The institution navigation** wraps to five rows at 375 px. It is 15 links and every one
  stays a 32 px target; wrapping is the correct behaviour and a drawer would hide the tabs
  behind an extra interaction for no gain.
- **The app header** wraps to three rows when signed in. Same reasoning. The marketing links
  are already `hidden md:flex`, with the footer carrying them on narrow screens.
- **`px-6` gutters** on every screen shell. 327 px of content at 375 px is tight but correct;
  the cards inside take another 24 px each side, which is what makes the tables scroll. Left
  alone deliberately — reducing card padding on small screens is a redesign.
- **Two-column grids** (`md:grid-cols-2`, `lg:grid-cols-2`) all collapse to one column below
  their breakpoint. Checked; no fix needed.

---

## Deferred, with reasons

Written down rather than fixed, in the order they are worth picking up.

1. **Links inside table cells are not identifiable as links.** `catalogue`, `notifications`,
   `deadlines` and the entity cards render them as `font-medium` with `hover:underline` only —
   same colour as the surrounding text. This is _not_ a 1.4.1 failure (the cue is weight, not
   colour), but it is not discoverable either. Fixing it is a visual decision across ~10
   components, which is a redesign and out of scope for a conformance pass.
2. **Focus is not moved to the first invalid field on submit** (see 3.3.1 above).
3. **`text-warning` has no legal light-mode use** (see 1.4.3 above). Needs a `--warning-text`
   token if the need ever arises.
4. **`Checkbox` is a 16 px target.** No call sites; fix it before the first one.
5. **A focusable table region adds a tab stop even when the table fits.** Removing it for
   non-overflowing tables needs a `ResizeObserver` in `Table`, which costs bundle and a layout
   read. Worth revisiting if the tab count becomes a complaint.
6. **The dev server does not hot-reload `messages/*.json` under Turbopack**, so a newly added
   key renders as its raw identifier until restart. Pre-existing; noted because it made
   `common.skipToContent` look broken during this pass when it was not.

## Nothing here needed a backend change

No API response shape, error body or permission answer had to move for any of it.
