---
name: inttegro-resolve-customer-case
description: Investigate one Inttegro customer issue across customers, orders, payment methods, messages, and refunds, then carry out the exact resolution the merchant approves. Use for support cases that need both evidence and action. Do not expose hidden contact or payment details, infer consent, or perform bulk outreach.
---

# Inttegro resolve customer case

Own one support case from evidence collection through authoritative resolution.

## Establish the case

1. Start from the supplied customer, order, payment, message, refund, or buy-link ID. If no stable identifier is available, use the narrowest bounded list and let the merchant disambiguate; do not guess from similar names.
2. Follow relationships only when Inttegro returns the linking ID. Use `get_customer`, customer-filtered `list_orders`, `get_order`, `list_payment_methods`, `list_messages`, `get_message`, `list_refunds`, `get_refund`, `list_buy_links`, and `get_buy_link` as the issue requires.
3. Continue a list only when the answer requires it. For an exhaustive request, follow `may_have_more` through page 10, deduplicate IDs, and disclose any remaining service ceiling.
4. Keep order, payment, refund, message, and buy-link states separate. Build a short timeline of confirmed facts, missing evidence, and the likely resolution options.

Customer projections deliberately hide email addresses, phone numbers, street addresses, and payment credentials. Do not ask the merchant to paste those values merely to compensate.

## Apply the approved resolution

Choose only the operation that matches the merchant's decision:

- Correct selected customer fields with `update_customer` after showing the exact changed fields.
- Send a finalized invoice with `send_order_invoice`, or a paid-order receipt with `send_order_receipt`.
- Send one consented message with `send_customer_sms`, or render and send a published template with `send_customer_template`. Never recreate a hidden previous message body.
- For payment help, call `prepare_order_payment`; call `pay_order` only after the merchant chooses an exact masked method. New payment details and OTP stay in secure Inttegro Checkout.
- For a refund, call `get_refund_options`, collect explicit per-line amounts and the required overall reason, then call `create_refund`. Use `cancel_refund` only for a still-pending refund the merchant explicitly wants canceled.
- Cancel an eligible order with `cancel_order` only when the merchant understands that this does not create a refund.

Every mutation gets a stable operation key. Reuse it only for an exact retry. A diagnostic request never authorizes a write, contact, payment, cancellation, or refund.

## Close the case

Reread the authoritative record after a mutation. Treat payment `processing`, refund `pending` or `processing`, and message queued or sent as waiting—not resolved. Return a compact case record with evidence IDs, approved action, confirmation or operation key, current state, outstanding dependency, and safest next check.
