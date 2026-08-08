## What & why

<!-- What changes, and what problem it solves. Link the issue. -->

## How to verify

<!-- The steps a reviewer should take. "CI is green" is not a verification plan. -->

## Checklist

- [ ] Title follows Conventional Commits (`feat(entities): …`)
- [ ] New code sits in the right FSD layer and imports only downward
- [ ] Anything user-facing goes through `messages/*.json` — no hard-coded strings
- [ ] Tests cover the behaviour, not just the lines
- [ ] If the API contract changed: backend `openapi.json` regenerated **and** `pnpm api:generate` run here
- [ ] No new `any`, no new ESLint suppressions without a comment explaining why

## Screenshots / recordings

<!-- For UI changes. Include light and dark, and a keyboard-only pass. -->
