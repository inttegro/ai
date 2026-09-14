---
metadata:
  internal: true
name: inttegro-collect-unpaid-orders
description: Find Inttegro orders that still need payment, prepare the appropriate recovery action, carry out only the actions the merchant approves, and reconcile the result. Use when a merchant asks about unpaid, outstanding, abandoned, or payment-pending orders. Do not use for unsolicited bulk messaging or automatic charging.
---

# Inttegro collect unpaid orders

Turn an unpaid-order search into a reviewed collection queue and completed follow-ups.

## Establish the queue

1. Preserve any order, customer, date, currency, or maximum-result constraint the merchant supplied.
2. For a known order, call `get_order`. Otherwise call `list_orders` with `page_size: 50`, starting at page 1 and using `customer_id` when known.
3. If the request means all matching orders, continue in page order while `may_have_more` is true, up to page 10. Deduplicate by order ID. If page 10 may have more, state that the scan reached the 500-order service ceiling and is not exhaustive.
4. Classify from returned fields only. Put explicit `requires_payment`, `requires_action`, or failed payment states in the collection queue; put processing and unknown states in a separate review queue. Never label an order unpaid merely because success is absent.
5. Fetch `get_order` for every order selected for action. Do not act on a stale list row.

Scanning never authorizes contact or payment. Present a compact queue with order ID or number, exact total and currency, order status, payment status, initiated time, and the proposed next step. Let the merchant select the orders and actions.

## Recover payment

- For a finalized order that should be delivered to the customer, use `send_order_invoice`. This can contact every available channel and needs its own confirmation.
- For a merchant-assisted payment attempt, call `prepare_order_payment`, show only its masked choices, and have the merchant choose attached, saved, or new. Call `pay_order` only for the exact approved choice. New details and OTP belong exclusively in the secure Inttegro Checkout URL.
- For a written reminder, use a published template through `send_customer_template`, or one exact consented SMS through `send_customer_sms`. Do not reconstruct contact details or repeat a message across customers as a broadcast.
- Use a different stable `operation_key` for each logical order action. Reuse a key only for an exact retry with unchanged arguments.

## Reconcile and report

After a payment attempt, reread the order. After a send, report its returned message lifecycle and use `get_message` if a later delivery check is requested. Treat `processing`, `requires_customer_action`, queued, and sent as incomplete states.

Finish with `completed`, `waiting`, and `not attempted` sections. Include order IDs, action result IDs, current states, and the scan boundary. Never call an attempted collection successful unless the authoritative order state shows payment succeeded.
