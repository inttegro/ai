---
metadata:
  internal: true
name: inttegro-fulfill-and-close
description: Find paid Inttegro orders that are not complete, let the merchant select orders whose fulfillment is finished, mark them complete, and optionally send receipts. Use for fulfillment closeout or paid-but-incomplete order queues. Do not infer physical delivery or complete orders without the merchant's confirmation.
---

# Inttegro fulfill and close

Close the operational gap between successful payment and completed fulfillment.

## Build the closeout queue

1. For a known order, call `get_order`. Otherwise call `list_orders` with `page_size: 50`, starting at page 1 and preserving a supplied `customer_id`.
2. When the merchant asks for all matching orders, continue while `may_have_more` is true, up to page 10. Deduplicate by ID and disclose the 500-order ceiling if page 10 may have more.
3. A candidate must have an authoritative paid or succeeded payment state and must not already be complete or canceled. Keep unknown and processing payment states out of the ready queue.
4. Present order ID or number, exact total and currency, payment state, order state, initiated time, and completed time. Do not claim that goods shipped or services were delivered: the minimized MCP projection intentionally omits fulfillment evidence.

Ask the merchant which candidates have actually been fulfilled. A request to inspect the queue is not authorization to complete it.

## Complete selected orders

For each selected order:

1. Refresh it with `get_order` immediately before acting.
2. If it is no longer paid, already complete, canceled, or otherwise ineligible, stop on that order and report the changed state.
3. Call `complete_order` with a stable, order-specific `operation_key`. Let Inttegro's confirmation be the final authorization.
4. Reread with `get_order`; only a completed authoritative state counts as success.

Do not use one operation key for several orders, and do not loop over unselected candidates.

## Send receipts

Offer `send_order_receipt` only after completion is verified and only when the merchant wants delivery. Receipt delivery is a separate external action with separate confirmation. Report partial channel outcomes honestly and do not expose customer contact details.

Return the completed orders, receipt outcomes, skipped or changed orders, and any unscanned remainder. Preserve IDs so the closeout can resume without repeating completed work.
