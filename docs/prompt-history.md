# Workify prompt history — 21 October 2026

Source: local Git history, current source, prior-stage reports and checks run in
this session. Reports of older checks are distinguished from today's results.
The active instructions are under
`resource --prompt section/new changes/new change/`, numbered 01–14.

| Stage | Work | Evidence and current status |
| --- | --- | --- |
| Earlier | Restore original frontend styling | `802dd47`, merged through PR #3 (`70cd669`) |
| Earlier | Remove Google sign-in; retain public browsing | `af018b8`, merged through PR #4 (`28cc543`) |
| 01 | Architecture/runtime diagnosis | Later reports reference diagnosis and read-only cloud evidence; no standalone completion report found |
| 02 | Public catalog and stale overlay fixes | `5b12acc`; public-read migration remains a separate deployment concern |
| 03 | Retire LinkedIn workshop/review branch | Local source/report/migration exist; migration not applied by this session; prior report says cloud archival was pending |
| 04 | Canonical root project layout | Local consolidation exists; `4e44491` included deletions/configuration/reports but omitted moved source additions |
| Dependency repair | Save omitted source and prior-stage tests | `5546517` on `fix/canonical-frontend-dependency`; routing changes kept in the next branch |
| 05 | URL routing and page shell | Implemented on `fix/url-routing-page-shell`, stacked on the dependency branch; see `docs/url-routing.md` |
| 06 | Auth session and unavailable-auth modal | Pending; stage 05 only adds route guards consuming the existing session interface |
| 07 | Shared state and typed API boundaries | Pending |
| 08 | Workshop lifecycle contract | Pending |
| 09 | Registration service | Pending |
| 10 | Meeting-link access | Pending |
| 11 | Attendee dashboard | Pending |
| 12 | Profile editor and avatar | Pending |
| 13 | Admin and contact-first hosting | Pending |
| 14 | Integration review and release plan | Pending |

The older prompts under `the prev chnage/` are historical. The numbered 01–14
sequence supersedes them. Google sign-in stays removed, hosting remains
contact-first/admin-controlled, and the existing blue/violet design remains.

## Today's validation

- Production build passed using isolated public test values; no real release
  environment variables are configured locally.
- All **46 desktop/mobile browser cases passed**, including 18 routing cases.
  Used installed Chrome (`PLAYWRIGHT_CHANNEL=chrome`). The runner initially
  hung during Windows web-server shutdown; the final run reused those same
  isolated test servers with a temporary config and exited successfully.
- All **5 configuration checks passed**.
- Lint has **0 errors and 10 effect/export warnings** (previous report: 9).
- Database suite: **2 passed, 1 failed**. Existing archival fixture/report says
  `F1 Forge`; the committed identity guard expects `ForMa`. The guard and
  fixtures were preserved. This discrepancy needs prior-stage review before
  claiming archival readiness.
- No migration was applied, cloud settings changed, merge performed or site
  deployed. Hosting provider and live refresh behavior remain unverified.

The review branches preserve the current local dependencies instead of using
the incomplete `4e44491` snapshot alone. The database mismatch is disclosed for
review rather than resolved by weakening the identity guard.
