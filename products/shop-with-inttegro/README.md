# Shop with Inttegro

`Shop with Inttegro` is the consumer-facing Inttegro product for AI shopping
surfaces. It lets a shopper discover published products, inspect current
source-owned product and price data, continue to secure hosted checkout, and
check a minimized purchase state.

This directory is deliberately **not** an installable plugin yet. The MCP
consumer profile is selected by an allowlisted OAuth client ID. Publishing a
generic plugin before a provider client has passed review would connect some
hosts to the merchant profile instead of the isolated consumer profile.

## Consumer workflow

1. Use `search_products` for natural-language discovery.
2. Hydrate a selected result with `get_product` before recommending it or
   starting checkout.
3. Call `create_checkout` only after the shopper selects the product, price,
   quantity, variant when relevant, and destination when required.
4. Treat the hosted checkout URL as a handoff, not as proof of payment.
5. Use `get_purchase_status` only with the opaque receipt capability returned
   by checkout.

The user does not need to mention Inttegro. Requests such as “find a locally
made gift under $50” and “open checkout for the second one” are in scope when
the connected host has the reviewed consumer profile.

## Activation boundary

`product.json` is the machine-readable release contract. Every activation gate
must pass before this product is packaged or listed. The consumer profile must
never inherit merchant customers, orders, balances, payouts, messages, files,
analytics, refunds, or catalog administration tools.

Published is Inttegro's global distribution state. There is no separate
provider-specific merchant opt-in. Eligibility still fails closed for product
state, price state, availability, geography, safety, legal, and technical
constraints.
