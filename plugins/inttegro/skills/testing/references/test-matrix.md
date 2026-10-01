# Test matrix

| Area | Required cases |
| --- | --- |
| Authentication | Missing bearer, invalid bearer, correct credential boundary, redacted logs |
| Request validation | Missing required field, invalid enum, malformed ID, unsupported state transition |
| Money | Zero and boundary values where allowed, currency preservation, minor-unit conversion, no cross-currency sum |
| Idempotency | First success, identical replay, same key with changed payload, timeout before response, concurrent replay |
| Transport | Connect timeout, response timeout, dropped connection, malformed response, server error, capped retry |
| Rate limiting | `429`, `Retry-After`, backoff, retry budget exhaustion |
| Conflict | `409`, read latest state, choose no-op or explicit next action |
| Pagination | Empty page, partial page, next page, bounded stop, duplicate or shifted item handling |
| Checkout | Finalized order, invoice URL, cancel return, pending, required action, paid lookup, repeated return, idempotent fulfillment |
| Reconciliation | Newly resolved resource, still pending resource, read failure, stale local state, repeated job run |
| Privacy | API key, headers, bodies, customer data, payment data, invoice and capability URLs absent from logs and fixtures |
| Observability | Static route, status, duration, request ID, safe error codes, trace linkage |

## Live end-to-end discipline

- Use a disposable or non-production Inttegro application and clearly named fixtures.
- Generate a new business identifier and idempotency key per logical test, while preserving the same key across that test's retries.
- Record created resource IDs for cleanup or later inspection.
- Verify final state through lookup, not only the mutation response or redirect.
- If cleanup is unsupported or would erase useful evidence, leave the fixture labeled and report it.
