---
name: inttegro-sell-by-link
description: Turn a product offer into a hosted Inttegro buy link and optionally send it to an existing customer. Use when a merchant wants to create a product or price, find a sellable price, create, inspect, update, cancel, display, or send a buy link. Do not use to collect payment inside the agent host, invent prices, or send a link without explicit merchant confirmation.
---

# Inttegro sell by link

Treat product, price, link, and message creation as separate authoritative steps.

## Resolve the offer

1. Use `list_products` or `get_product` to find an existing product. Use `list_prices` or `get_price` to verify the selected price.
2. When the merchant wants to inspect one resolved product visually and the host supports MCP Apps UI, pass the unchanged `get_product` result to `render_product_card`. Do not substitute the catalog carousel for a single-product view.
3. If no suitable product exists, gather the exact name, type, reference, and description, then call `create_product` with a stable operation key after confirmation.
4. If no suitable price exists, gather the exact ISO currency and a major-unit decimal string such as `350.00`, then call `create_product_price` with a stable operation key after confirmation. Never infer an amount or ask the user to convert it to minor units.

## Create and present the link

1. Confirm product ID, price ID, minimum and maximum quantity, single-use behavior, and optional expiry.
2. Call `create_buy_link` with a stable operation key and accept only the server's canonical URL.
3. In a host that advertises MCP Apps UI, use `render_buy_link_card` with the unchanged returned `buy_link` when a visual handoff is useful. In other hosts, return the canonical hosted-checkout URL and structured status directly.
4. For later lifecycle work, use `list_buy_links`, `get_buy_link`, `update_buy_link`, or `cancel_buy_link`. Cancellation is destructive and requires an explicit confirmation.

## Send the link

1. Resolve an existing, consented customer ID. Never ask for or pass a raw phone number.
2. Keep `message_prefix` short enough for the server-enforced SMS limit.
3. Call `send_buy_link_sms` only after the merchant confirms the exact customer, canonical link, and message. Report the returned delivery status; do not equate attempted delivery with delivered.

Never use an embedded payment sheet. The buy link opens Inttegro's external hosted checkout.
