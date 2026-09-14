# Diagnostic map

| Evidence | Likely boundary | Next check |
| --- | --- | --- |
| No HTTP response | DNS, TLS, proxy, connection timeout | Confirm origin, network policy, timeout, and whether the request left the application |
| `400` | Malformed request | Compare method, content type, JSON shape, and required fields with the operation reference |
| `401` | Missing, invalid, revoked, or wrong-environment key | Confirm server-side secret selection and bearer formatting without printing the key |
| `403` | Credential lacks permission | Inspect the intended operation and granted resource permission; retries do not add scope |
| `404` | Wrong route or resource ID | Confirm the production origin, static route, tenant context, and stored ID |
| `409` | Concurrent or stale-state transition | Fetch the current resource and decide from its latest state |
| `422` | Valid JSON violates a business rule | Use `error.code` and `fix_code`; satisfy the lifecycle prerequisite or change input |
| `429` | Rate limit | Honor `Retry-After`; inspect concurrency and retry amplification |
| `5xx` or transient type | Service or dependency failure | Retry with capped exponential backoff and the same logical idempotency key |
| Timeout during write | Unknown outcome | Replay idempotently or look up current state before any replacement write |
| Checkout returned but app is pending | Return route is not authoritative | Look up the stored order ID and branch on current order and payment state |
| MCP tools missing | Wrong endpoint, authentication, organization, scope, or stale catalog | Use the origin-root MCP URL, reconnect or resync, and inspect the authorized catalog |
| MCP write cannot confirm | Host lacks form elicitation or secure fallback flow | Use Inttegro's hosted confirmation path where supported; do not bypass confirmation |
| Rich MCP card absent | Host ignores MCP Apps presentation metadata | Verify structured tool output; treat the host renderer as a separate capability |

## Idempotency conflict

If the same key is used with a changed operation or payload, stop. Recover the result of the original logical action or create a deliberately new action with a new key. Do not rotate keys until the business intent is clear.

## Reporting

Include the safe request ID, exact structured code, current resource state, cause, corrective change, regression test, and remaining environment uncertainty. Do not claim a service-side incident without live evidence.
