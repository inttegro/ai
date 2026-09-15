---
metadata:
  internal: true
name: inttegro-payment-refund
description: Take payment for an Inttegro order or guide a line-item refund. Use when a merchant wants to select a saved or new payment method, start or retry payment, inspect refund availability, create a partial or full refund, check refund status, or cancel a pending refund.
---

# Inttegro payment and refund

Keep money values explicit, payment details out of chat, and lifecycle claims tied to authoritative results.

## Take payment

1. Call `prepare_order_payment` before discussing a charge. Present its attached and saved methods as numbered, masked choices alongside the exact major-unit order total and currency. Offer secure entry for a new method.
2. Ask the user to choose one option. Never ask for a full account/card/phone number or OTP in chat.
3. For an attached or saved method, call `pay_order` with a stable operation key and let its exact confirmation gate the real attempt. For a new method, return the trusted Inttegro Checkout URL and have the user enter details there.
4. Treat `requires_customer_action` as incomplete and direct the user to secure checkout. Treat `processing` or an ambiguous response as unresolved. Call `get_order` before reporting success or retrying.
5. Reuse an operation key only for an exact transport replay. An intentional retry is a fresh attempt and needs a new key.

## Create a refund

Call `get_refund_options` first, then keep the conversation progressive:

1. Show a compact numbered list with each line's label, remaining refundable amount in major units, and currency.
2. Ask which lines are affected.
3. Ask for an explicit major-unit decimal amount for each selected line, such as `25.00`. You may offer the full remaining amount, but never assume it and never ask the user to calculate minor units.
4. Invite an optional supported reason and detail for each line. A `custom` reason requires detail.
5. Ask for the compulsory overall refund reason. An overall `custom` reason requires detail.
6. Summarize the exact per-line amounts, total, reasons, and details once. Then call `create_refund`; its MCP confirmation is the final authorization.

Refund creation is asynchronous. Say that `pending` or `processing` has started, not completed. Use `get_refund` to reconcile and call it completed only when status is `succeeded`. Use `cancel_refund` only for a still-pending refund and preserve its separate confirmation.

If the refreshed refund snapshot or owning API rejects the request, explain the current constraint and return to the affected choice instead of silently changing an amount, line, or reason.

## Monitor refunds

Use `list_refunds` for a bounded operational page and `get_refund` for the authoritative state of a selected refund. When the user asks for all returned exceptions, continue sequentially while `may_have_more` is true through page 10, deduplicate by refund ID, and disclose the 500-refund ceiling if more may remain. Keep pending, processing, succeeded, failed, and canceled separate; `succeeded` confirms the Inttegro refund lifecycle, not when the customer's bank or wallet displays the credit.
