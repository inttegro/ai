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

## If webhooks become available

Treat a webhook as a notification, not settlement proof:

1. Verify the signature using the documented raw-body algorithm.
2. Deduplicate by event ID.
3. Fetch the referenced Inttegro resource.
4. Apply the same idempotent convergence function used by reconciliation.
5. Acknowledge only after durable receipt or processing according to the future delivery contract.

Do not implement these signature details until Inttegro publishes the merchant webhook contract.
