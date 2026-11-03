# Docker image reference implementation plan

1. Write failing behavioral parser tests. Implement the bounded parser and pure
   sample module; verify successful vectors and all-or-nothing failures.
2. Add Vapor UI, five message dictionaries, guides, catalog/icon and App routing.
   Test immediate parsing, export, edit/rejected-paste invalidation and lifecycle.
3. Add four-project browser tests and synthetic theme/width screenshots. Document
   usage, exact scope, limits, privacy and DevToys overlap decision.
4. Run required quality gates, get independent review and address findings.
   Commit/push a draft PR with exact validation evidence and screenshots.
5. Validate the final commit, make PR ready, re-read current main/head/checks/
   review constraints and use ordinary expected-head merge.
6. Track existing main CI/Pages deployment, compare public component bytes with
   its CI artifact and verify actual browser behavior. Report exact SHAs/links,
   checks, public evidence and any concrete blocker.
