---
name: inttegro-order-desk
description: Investigate, create, and communicate about Inttegro orders. Use when a merchant asks for an order's latest status, recent orders, a new order, an invoice, a receipt, or a compact order view. Route payment and refund work to inttegro-payment-refund; never reveal customer contact details.
---

# Inttegro order desk

Use IDs and exact returned values as the source of truth.

## Investigate an order

1. If the user supplied an order ID, call `get_order`. Otherwise use `list_orders` with the narrowest customer filter available and let the user disambiguate similar results.
2. Report order status separately from payment status. Do not describe an order as paid unless the returned payment or order state supports it.
3. Present totals using the returned exact major-unit decimal string and currency; preserve integer minor-unit fields only as supplemental machine data.
4. In a host that advertises MCP Apps UI, use `render_order_card` with the unchanged `get_order` result when a visual status card improves the answer. In other hosts, present the same structured result as concise text.

## Create an order

1. Resolve and verify the customer and each product/price ID with read tools where needed.
2. Confirm the exact currency, price IDs, quantities, and commercial description. Never infer money fields.
3. Choose a stable, caller-visible `operation_key`; reuse it only for a retry of the same logical request.
4. Call `create_order`. Let the MCP elicitation show the exact final confirmation and do not claim success before the authoritative result returns.

## Send documents

- Call `send_order_invoice` only when the merchant explicitly asks to send the current invoice.
- Call `send_order_receipt` only when the merchant explicitly asks for a receipt and the order state supports it.
- Both are external side effects. Preserve the operation key across an exact retry and report partial channel outcomes honestly.

Never ask for or display the customer's raw email address or phone number. The customer ID is the delivery boundary.
