---
name: inttegro-webhooks
description: Design event-driven or state-synchronization behavior for an Inttegro integration. Use when a developer asks for Inttegro webhooks, callback verification, payment events, order notifications, background sync, polling, or reconciliation. Inttegro does not currently expose merchant-facing webhooks, so route implementations to documented lookup and page endpoints.
---

# Inttegro webhooks

Do not invent a webhook receiver. Inttegro currently exposes no merchant-facing webhook registration or delivery contract for orders, payments, payouts, refunds, or messages.

## Replace the event assumption

1. Identify the resource transition and latency requirement the application intended to observe.
2. Store the resource ID and state returned by every Inttegro write.
3. Use a lookup endpoint when tracking one known resource. Use a page endpoint for bounded operational reconciliation.
4. For a customer waiting screen, poll for a short bounded window, then show a pending state and let background reconciliation continue.
5. Treat Inttegro's retrieved resource as authoritative for Inttegro-owned state. Make downstream local side effects idempotent.
6. Record the last successful check and the last observed state. Alert only after the business-specific resolution window is exceeded.

Read [state convergence patterns](references/state-convergence.md), then implement against [Webhooks](https://studio.inttegro.dev/api/webhooks) and the relevant resource reference.

## Avoid false integrations

- Do not expose a guessed `/webhooks/inttegro` route as if Inttegro will call it.
- Do not use browser success redirects as payment events.
- Do not treat internal provider callbacks mentioned in implementation details as a public merchant surface.
- Do not page indefinitely in an interactive request or infer that one bounded page is the complete dataset.
- Do not repeatedly perform a write to discover whether the earlier write succeeded; replay idempotently or read state.

## Keep a future webhook boundary clean

Put local state application behind one idempotent convergence function that accepts a freshly retrieved Inttegro resource. A future verified webhook can call that same function after fetching canonical state. This prevents delivery order, retries, or payload drift from becoming business-state corruption.
