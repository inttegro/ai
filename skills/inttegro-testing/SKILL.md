---
name: inttegro-testing
description: Create or run a test strategy for an Inttegro API, SDK, Checkout, or MCP integration. Use when a developer needs fixtures, mocks, contract tests, failure injection, idempotency tests, checkout end-to-end coverage, CI gates, or a production-readiness test plan.
---

# Inttegro testing

Prove the application boundary, state transitions, and failure recovery—not just that one happy-path request returned 200.

## Build the test layers

1. Inspect the application's existing test framework and integration seams. Reuse its HTTP mocking, dependency injection, database fixtures, and end-to-end harness.
2. Read [test matrix](references/test-matrix.md) and select only the rows relevant to the implemented operations.
3. Unit-test request construction, minor-unit money handling, stable idempotency keys, structured error mapping, and secret redaction.
4. Contract-test the exact public response shapes used by the application. Keep fixtures minimal and label their source contract version or capture date.
5. Integration-test persistence and recovery around the Inttegro client: returned IDs, unknown write outcomes, conflicts, pending states, and reconciliation.
6. Run a disposable live end-to-end flow when credentials and a safe Inttegro application are available. Do not point automated CI at a production merchant account.

## Test invariants

- A replay with the same key and same payload cannot create a second logical action.
- A changed payload never silently reuses the earlier successful action.
- A lost write response leads to replay or lookup, not a replacement write.
- Every money assertion includes currency and integer minor units.
- A checkout return or UI success state cannot trigger fulfillment without authoritative order lookup.
- Pending and required-action states remain pending; they are not converted to success by elapsed time.
- Credentials, customer contact data, payment data, invoice URLs, and capability links never appear in snapshots or logs.
- One page of results is never described as the complete collection unless the response proves completion.

## Finish with a readiness report

Report which layers ran, which cases passed, the Inttegro environment and fixture scope, resources created, cleanup status, and any live behavior that remains unverified. Separate mocked contract evidence from live service evidence.

Use [API errors](https://studio.inttegro.dev/api/errors), [Idempotency](https://studio.inttegro.dev/api/idempotency), and the operation-specific reference to build fixtures.
