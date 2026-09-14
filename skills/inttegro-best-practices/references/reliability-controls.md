# Reliability controls

## Retry decision

| Condition | Action |
| --- | --- |
| Invalid or missing input | Correct the request; do not repeat unchanged |
| Authentication failure | Stop, verify the credential and environment, then retry deliberately |
| Authorization failure | Stop and request the required permission; a retry cannot add scope |
| Rate limit | Wait for `Retry-After`, then retry with the same logical idempotency key |
| Transient or server failure | Retry with exponential backoff, jitter, a cap, and the same logical key |
| Timeout or dropped connection during a write | Treat the result as unknown; replay idempotently or read current state |
| HTTP 409 or transition conflict | Fetch current state before choosing the next transition |
| Business-rule rejection | Satisfy the stated precondition or change the workflow |

Never generate a fresh idempotency key merely because the first response was lost. A new key describes a new action.

## Logging allowlist

Log operation name, static route, HTTP status, elapsed time, request ID, safe structured error codes, SDK version, and trace identifiers. Redact authorization headers, request and response bodies, customer contact data, payment data, resource-bearing URLs, hosted invoice URLs, and capability links.

## SDK observability

Released server SDKs can integrate with application-owned OpenTelemetry and a privacy-safe error reporter. Configuration is opt-in. Keep traces and reports within the application's existing telemetry policy, and consult [SDK observability](https://studio.inttegro.dev/sdk-observability) for the language-specific contract.

## Reconciliation

Persist the Inttegro resource ID and local business ID together. For active user flows, poll lookup endpoints for a bounded period and then show a pending state. For operational convergence, run a bounded scheduled job over recent or unresolved records. Record the last check and alert only after the business-specific resolution window has elapsed.

Inttegro currently has no merchant-facing webhooks. Do not wait for or implement an undocumented callback URL.
