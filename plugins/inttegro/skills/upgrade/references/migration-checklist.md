# Migration checklist

## Inventory

- Package name, installed version, target released version, runtime requirement, and lockfile
- Client construction, base URL, authentication, timeouts, retries, and observability hooks
- Operations used and local wrappers around their request and response types
- Persisted Inttegro fields and enums
- Error handling and customer-facing error mapping
- Idempotency key generation and storage
- Pagination and reconciliation behavior
- Checkout URLs, redirect handling, and authoritative state verification
- Mocks, recorded fixtures, generated clients, and snapshots

## Delta categories

| Category | Review |
| --- | --- |
| Compile-time | Renamed types or methods, changed parameters, moved namespaces, runtime or package constraints |
| Wire contract | Added required fields, changed nullability, enum expansion, response projection, header behavior |
| Lifecycle | New or stricter preconditions, pending states, terminal-state semantics, conflict recovery |
| Reliability | Idempotency support, retry classification, timeout defaults, request ID exposure |
| Privacy | Newly minimized fields, logging defaults, error reporter data, secret handling |
| Checkout | Finalization, invoice URL path, redirect settings, return verification, fulfillment boundary |
| Observability | Trace setup, error reporter policy, route naming, safe attributes |

## Verification gates

The migration is not complete until the dependency graph resolves, the old API usage is gone or intentionally shimmed, generated code matches its source contract, focused tests pass, and a complete non-production journey verifies current resource state after the write.
