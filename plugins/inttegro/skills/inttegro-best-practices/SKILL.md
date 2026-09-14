---
name: inttegro-best-practices
description: Review or implement an Inttegro API or SDK integration for production safety. Use when a developer needs guidance on authentication, money, idempotency, retries, pagination, request IDs, logging, observability, state reconciliation, or client/server boundaries.
---

# Inttegro best practices

Apply these controls to every Inttegro integration, then use the endpoint reference for operation-specific behavior.

## Protect the boundary

- Call Inttegro from a trusted server or serverless function. Load `INTTEGRO_API_KEY` from the platform's secret store and send it as a bearer token.
- Never expose a key through browser bundles, native application resources, public environment variables, URLs, logs, error trackers, fixtures, or chat.
- Use separate credentials and applications for local, test, staging, and production. Rotate a key immediately if it reaches an untrusted surface.
- Persist only the customer and payment projections returned by the public contract. Do not infer or request raw payment credentials.

## Preserve correctness

- Represent authoritative money as integer minor units with an explicit lowercase currency. Format major-unit decimals only at display boundaries.
- Create a stable idempotency key before the first attempt of each supported write. Reuse it only for the same operation and unchanged payload; Inttegro retains successful replay results for 24 hours.
- Store resource IDs returned by writes. If the response is lost, retry the same logical request with its key or look up the resource before starting a replacement action.
- Treat order, payment, refund, and payout status as state machines. Fetch the current object before deciding how to recover from a conflict or asynchronous result.
- Keep customer return routes separate from authoritative state verification. A successful browser redirect does not prove payment.

## Handle failures deliberately

Read [reliability controls](references/reliability-controls.md) before implementing retries or logging. Base recovery on the structured `type`, `fix_code`, and `code`, not HTTP status alone. Preserve `X-Request-Id` for correlation.

## Review before shipping

Verify that:

- secrets are server-side and redacted;
- every critical write has one logical idempotency key;
- timeouts, backoff, `Retry-After`, and retry limits are explicit;
- ambiguous writes converge through replay or lookup;
- pagination is bounded and does not mistake one page for a complete dataset;
- each amount retains currency and minor units;
- logs use static routes rather than resource-bearing URLs;
- checkout and asynchronous flows read authoritative state;
- expected API failures are mapped to appropriate user copy; and
- tests cover success, invalid input, authentication, timeout, replay, conflict, and pending states.

Use [Authentication](https://studio.inttegro.dev/api/authentication), [Idempotency](https://studio.inttegro.dev/api/idempotency), [Errors](https://studio.inttegro.dev/api/errors), and the current [API reference](https://studio.inttegro.dev/api) as the source contract.
