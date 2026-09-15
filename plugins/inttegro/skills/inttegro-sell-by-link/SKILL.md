---
metadata:
  internal: true
name: inttegro-sell-by-link
description: Create, inspect, update, cancel, display, or send a hosted buy link for an existing published Inttegro product and active price. Use for link lifecycle and delivery; use inttegro-launch-offer when product or price setup is needed.
---

# Inttegro sell by link

Treat link creation, link changes, and customer delivery as separate actions. This workflow starts from an existing sellable product and price; it does not create or change catalog terms.

## Resolve the offer

1. Use `list_products` or `get_product` to find an existing product. Use `list_prices` or `get_price` to verify the selected price.
2. For an exhaustive catalog search, continue while `may_have_more` is true through page 10, deduplicate IDs, and disclose any remaining 500-record service ceiling.
3. When the merchant wants to compare the returned page visually and the host supports MCP Apps UI, pass the unchanged `list_products` result to `render_catalog_carousel`. For one resolved product, pass the unchanged `get_product` result to `render_product_card`.
4. Verify the product is published and the selected price is active, unarchived, and belongs to it. If setup or changed commercial terms are needed, stop and use `inttegro-launch-offer` only when the merchant requests that work.

## Create and present the link

1. Confirm product ID, price ID, minimum and maximum quantity, single-use behavior, and optional expiry. Do not invent missing commercial choices.
2. Call `create_buy_link` with a stable operation key and accept only the server's canonical URL.
3. In a host that advertises MCP Apps UI, use `render_buy_link_card` with the unchanged returned `buy_link` when a visual handoff is useful. In other hosts, return the canonical hosted-checkout URL and structured status directly.
4. For later lifecycle work, use `list_buy_links`, `get_buy_link`, `update_buy_link`, or `cancel_buy_link`. Cancellation is destructive and requires an explicit confirmation.

## Send the link

1. Resolve an existing, consented customer ID. Never ask for or pass a raw phone number.
2. Keep `message_prefix` short enough for the server-enforced SMS limit.
3. Call `send_buy_link_sms` only after the merchant confirms the exact customer, canonical link, and message. Report the returned delivery status; do not equate attempted delivery with delivered.

Never use an embedded payment sheet. The buy link opens Inttegro's external hosted checkout.
