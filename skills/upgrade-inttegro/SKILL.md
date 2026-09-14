---
name: upgrade-inttegro
description: Upgrade an Inttegro SDK, generated client, API contract, Checkout flow, or MCP integration. Use when a developer needs to move to a newer Inttegro release, remove deprecated usage, compare versions, update generated types, or plan and verify a safe migration.
---

# Upgrade Inttegro

Treat an Inttegro upgrade as a contract migration with explicit before-and-after evidence.

## Inventory the current integration

1. Inspect dependency manifests and lockfiles for the installed SDK package and version.
2. Find Inttegro client initialization, raw API calls, generated code, money conversions, error handling, pagination, checkout redirects, state polling, and tests.
3. Record the currently assumed API fields, enum values, lifecycle states, retry behavior, and runtime requirements.
4. Confirm the target released version and installation guidance in [Inttegro SDKs](https://studio.inttegro.dev/sdks). Do not guess a registry version from source tags or preview documentation.

## Build the migration delta

Read [migration checklist](references/migration-checklist.md). Compare current code with the target SDK guide and [API reference](https://studio.inttegro.dev/api). Identify compile-time changes separately from behavioral changes such as error types, idempotency, pagination, async states, observability, and checkout verification.

If the project uses generated code, regenerate from the current public OpenAPI document using the project's pinned generator. Review the generated diff; do not hand-edit generated output to hide a contract mismatch.

## Apply and verify

- Upgrade one integration boundary at a time and keep compatibility shims only when downstream callers still require them.
- Replace deprecated calls with target-version equivalents before deleting the old path.
- Run formatting, type checks, unit tests, contract tests, and the affected end-to-end flow.
- Test one successful write, idempotent replay, structured API failure, timeout or ambiguous result, and authoritative lookup.
- Report installed and target versions, files changed, behavior changes, tests run, and any release or live verification still pending.

Do not combine unrelated framework or dependency upgrades unless the target SDK requires them.
