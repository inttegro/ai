---
name: inttegro
description: Build or modify an Inttegro integration using the public API, official SDKs, hosted Checkout, or MCP. Use when a developer asks how to add Inttegro, choose an integration path, implement an order or payment flow, or review an existing integration. Route focused work to the companion Inttegro developer skills.
---

# Inttegro

Choose the smallest supported integration surface, inspect the host application, and implement against the current Inttegro contract.

## Establish the path

1. Identify the first user outcome, trusted server runtime, frontend or mobile client, and whether a customer-facing checkout is required.
2. Inspect the repository before recommending a library. Detect the language, framework, package manager, server boundary, existing payment state, tests, and deployment constraints.
3. Read [integration paths](references/integration-paths.md), then choose one primary path. Do not combine API, SDK, Checkout, and MCP by default.
4. Open the linked Studio reference for every operation being implemented. Treat its request and response contract as authoritative; do not invent fields or lifecycle states.
5. Keep the API key in trusted server infrastructure. Never place it in browser code, a native binary, source control, logs, or chat.

## Implement the first complete slice

- Start with one end-to-end outcome, not a broad client wrapper. A checkout slice usually creates a finalized order, stores its ID, redirects to the hosted invoice URL, and verifies the returned order state.
- Use integer minor units for authoritative money values. Keep currency beside every amount and never combine different currencies.
- Generate one stable idempotency key before the first supported write. Reuse the same key and unchanged payload when retrying that logical action.
- Persist returned Inttegro resource IDs beside local records. Resolve an ambiguous write by reading state or retrying idempotently before creating a replacement.
- Parse structured errors by `type`, `fix_code`, and `code`. Preserve the response request ID for support and logs; do not expose raw developer error copy to shoppers.
- Add timeouts and bounded retries. Honor `Retry-After` for rate limits and do not retry invalid input without changing it.

## Route focused work

- Use `$inttegro-best-practices` for security, money, retries, pagination, logging, and production controls.
- Use `$inttegro-checkout` for hosted checkout, redirects, status verification, and fulfillment boundaries.
- Use `$inttegro-webhooks` when a design assumes event delivery; it explains the current lookup and reconciliation contract.
- Use `$inttegro-testing` to build the sandbox, failure, and end-to-end test matrix.
- Use `$inttegro-debug` to diagnose an existing failure from request through authoritative resource state.
- Use `$upgrade-inttegro` for SDK or API migrations.
- Use `$inttegro-mcp` for agent connections, MCP Apps, or MCP-powered developer tooling.

## Finish with evidence

Run the repository's focused tests and static checks. Report the exact integration path, operations added, state-verification point, failure cases tested, and anything that still requires a live Inttegro account or deployment proof.
