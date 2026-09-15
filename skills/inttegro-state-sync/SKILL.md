---
name: inttegro-state-sync
description: Keep an application's Inttegro-owned state current through lookup, bounded polling, and reconciliation. Use when a developer needs order, payment, refund, payout, or message status updates, background sync, or asks how to use Inttegro webhooks.
---

# Inttegro state sync

Build state updates from documented reads. Inttegro does not currently publish a merchant-facing webhook registration or delivery contract; do not implement a receiver expecting Inttegro events.

## Choose the smallest supported check

1. Identify the resource transition and latency requirement the application intended to observe.
2. Store the resource ID and state returned by every Inttegro write.
3. Use a lookup endpoint when tracking one known resource. Use a page endpoint for bounded operational reconciliation where the resource exposes one.
4. For a customer waiting screen, poll for a short bounded window, then show a pending state and let background reconciliation continue.
5. Treat Inttegro's retrieved resource as authoritative for Inttegro-owned state. Make downstream local side effects idempotent.
6. Record the last successful check and the last observed state. Alert only after the business-specific resolution window is exceeded.

Read [state convergence patterns](references/state-convergence.md) for known-resource and background-sync designs. Confirm the current [webhook status](https://studio.inttegro.dev/api/webhooks) and the exact lookup or page operation in the resource reference before implementation.

## Avoid false signals

- Do not expose a guessed `/webhooks/inttegro` route as if Inttegro will call it.
- Do not use browser success redirects as payment events.
- Do not treat internal provider callbacks mentioned in implementation details as a public merchant surface.
- Do not page indefinitely in an interactive request or infer that one bounded page is the complete dataset.
- Do not repeatedly perform a write to discover whether the earlier write succeeded; replay idempotently or read state.

## Keep an event boundary clean

Put local state application behind one idempotent convergence function that accepts a freshly retrieved Inttegro resource. If a documented webhook becomes available later, it can trigger that same read-and-converge path; do not implement speculative signature or event schemas now.
