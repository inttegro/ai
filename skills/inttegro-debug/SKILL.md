---
name: inttegro-debug
description: Diagnose a failing Inttegro API, SDK, Checkout, or MCP integration. Use when a developer reports authentication, authorization, validation, timeout, retry, idempotency, payment-state, redirect, pagination, SDK, or connector failures and wants an evidence-backed cause and repair.
---

# Inttegro debug

Trace one failing request or workflow from the application boundary to current Inttegro resource state. Diagnose before changing code or live data.

## Capture safe evidence

Collect the runtime and SDK version, static operation or route, HTTP status, `X-Request-Id`, structured `error.type`, `error.fix_code`, `error.code`, whether the request was a retry, and the current resource state when an ID exists.

Do not request or print bearer tokens, authorization headers, full bodies with customer data, raw payment data, invoice URLs, or capability links. Use redacted structural examples.

## Follow the diagnostic order

1. Reproduce with the smallest safe request in the same environment and credential boundary.
2. Confirm the request is sent from trusted server code to `https://api.inttegro.com`, or MCP is connected to `https://mcp.inttegro.com` without an added path.
3. Classify the failure using [diagnostic map](references/diagnostic-map.md). Prefer the structured error fields over guessed meaning from status text.
4. For timeouts, conflicts, or uncertain writes, read the current resource or replay with the original idempotency key and unchanged payload. Do not create a replacement action first.
5. Compare the exact request field, enum, and lifecycle precondition with the current Studio API reference and the installed SDK version.
6. Isolate whether the defect is request construction, credential or scope, transport, stale local state, unsupported lifecycle transition, or client presentation.

## Repair narrowly

Change only the failing boundary. Add a regression test that reproduces the original code, status, and state condition. Preserve safe request correlation and report whether verification used mocks, a disposable live application, or production read-only evidence.

Use [Errors](https://studio.inttegro.dev/api/errors) and [Error codes](https://studio.inttegro.dev/api/error-codes) for the current recovery contract.
