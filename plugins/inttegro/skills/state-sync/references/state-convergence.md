# State convergence patterns

## Known resource

After a write, persist the Inttegro resource ID. Look it up when the user returns or while a live flow is waiting. Stop interactive polling after a bounded interval and render an honest pending state.

Use this for orders, refunds, payouts, Chimes, scheduled Chimes, broadcasts, and OTP transactions when the workflow already has an ID.

## Operational reconciliation

Run a scheduled job over a bounded time range or explicit unresolved set:

1. Select local records whose Inttegro state is unresolved or recently active.
2. Fetch current state by ID, or page through the relevant Inttegro resource when supported.
3. Compare the canonical state with the local projection.
4. Apply the local transition through an idempotent function.
5. Store the observed state and check time.
6. Retry transient reads with capped backoff; quarantine persistent mismatches for review.

Use balance transactions for money-movement reconciliation rather than reconstructing settlement from orders or payouts alone.

## Future event delivery

Keep the local convergence function independent of the trigger. If Inttegro later publishes a merchant event-delivery contract, implement its documented authentication, deduplication, and acknowledgement rules before connecting it to the existing read-and-converge path. Do not guess those rules today.
