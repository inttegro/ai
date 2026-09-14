# Implementation and state

## Responsibility boundary

| Application server | Application client | Inttegro Checkout |
| --- | --- | --- |
| Authenticate, create and finalize the order, store IDs, look up state, decide fulfillment | Request checkout, navigate to the hosted URL, show pending/success/cancel UX | Display the order, offer supported payment methods, handle required confirmation, update payment and order state |

The client may receive a hosted URL and a minimal local checkout identifier. It must not receive the Inttegro API key or become the authority for paid state.

## State decisions

- `requires_payment`: payment collection is not complete.
- `paid`: payment succeeded; fulfillment may still be outstanding.
- `completed`: the application recorded fulfillment.
- `canceled` or `expired`: terminal; do not retry payment on that order.
- `payment.next_action`: the customer must complete the returned step before the flow can finish.

When the current response is pending, poll lookup at a modest interval for a bounded user-facing window, then stop and show pending. Continue convergence in a background reconciliation job.

## Security review

- Allow only application-owned HTTPS redirect origins.
- Bind the local session to the stored order ID; do not trust an arbitrary ID from the return URL.
- Avoid placing invoice URLs in analytics events, public logs, support screenshots, or referrer-bearing pages.
- Make fulfillment idempotent independently of Inttegro order creation.
- Re-read order state before any retry after a timeout or transition conflict.

Canonical overview: [Inttegro Checkout](https://studio.inttegro.dev/products/checkout).
