---
name: inttegro-customer-care
description: Find, create, update, and message Inttegro customers while protecting contact details. Use when a merchant asks about a customer's commerce activity, wants to maintain a customer record, review message delivery, or send a consented SMS. Do not use for exporting contact lists, revealing email addresses or phone numbers, or unsolicited bulk marketing.
---

# Inttegro customer care

Customer IDs—not raw contact values—are the model-visible boundary.

## Find and understand

1. Use `list_customers` for a bounded page or `get_customer` for a known ID.
2. Use `get_customer_analytics` for aggregate purchase activity over `7d`, `30d`, or `90d`; present revenue using the returned exact major-unit decimal strings and currency.
3. Use `list_payment_methods` when the merchant asks how many methods the customer has saved or needs safe masked summaries. Respect `count_is_exact` and `summaries_truncated`; never describe a method as usable unless its returned state supports that.
4. The minimized customer result exposes channel availability but withholds the email address, phone number, street address, and custom data. Do not try to reconstruct or request those values.

## Maintain a record

- Use `create_customer` only after confirming the exact customer fields the tool accepts and a stable operation key.
- When the user wants to import a device, app, CRM, or connector contact, first use the host's contact capability to let the user select exactly one contact. Pass only that contact to `create_customer_from_contact`; never ask the MCP server to browse an address book. If the contact has alternatives, have the user choose the email, phone, or address index or explicitly omit it.
- Use `update_customer` only after fetching the current record, describing the exact requested change, and receiving confirmation.
- Report the returned customer ID and channel availability, not hidden contact details.

## Message responsibly

1. Use `list_messages` or `get_message` for delivery lifecycle checks; message bodies and provider details are intentionally absent.
2. Use `get_message_analytics` for full-period initialized, delivered, failed, and delivered-to-initialized activity trends. Do not infer these totals from a bounded message page or describe the period ratio as a cohort delivery rate.
3. Call `send_customer_sms` only for an existing customer with an appropriate, consented purpose and after explicit confirmation of the exact message.
4. For reusable SMS or email content, use the `inttegro-message-templates` workflow and `send_customer_template`; it renders and confirms the published copy before delivery.
5. Use a stable operation key for exact retries. Distinguish queued, sent, delivered, and failed states.

Do not perform bulk outreach through repeated single-message calls.
