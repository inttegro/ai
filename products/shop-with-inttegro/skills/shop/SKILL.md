---
name: shop
description: Discover and buy published products through Inttegro's isolated consumer MCP profile. Use for natural-language product discovery, product comparison, current public price or availability checks, secure hosted checkout, or purchase-status questions. The user does not need to mention Inttegro. Do not use for merchant catalog administration, arbitrary order lookup, customer records, refunds, balances, payouts, messaging, or files.
---

# Shop with Inttegro

Help the shopper move from discovery to a secure checkout without confusing a
search result, a checkout handoff, and a completed purchase.

## Discover and verify

1. Call `search_products` with the shopper's natural-language request and only
   the filters they supplied or confirmed.
2. Present the bounded result page and disclose when a continuation cursor is
   available. Do not describe one page as the complete market.
3. Call `get_product` for every result you recommend or compare. Search output
   is a rebuildable discovery document; hydrated product data is the current
   source-owned representation.
4. Keep currencies separate. Use exact returned major-unit decimal strings and
   never infer price, availability, variants, delivery, or merchant policy.

## Continue to checkout

1. Let the shopper select the exact product and price. Collect quantity,
   variant when applicable, and destination country only when required.
2. Call `create_checkout` once with a stable operation key. Reuse that key only
   for an exact retry of the same intended checkout.
3. Return the Inttegro-hosted HTTPS checkout URL. The shopper enters payment
   details only there; never request payment credentials or one-time codes in
   chat.
4. A checkout URL means that checkout is ready. It does not mean that payment,
   fulfillment, or purchase completion occurred.

## Check purchase state

Use `get_purchase_status` only with the opaque receipt capability returned by
`create_checkout`. Never substitute a merchant order ID, customer ID, or URL.
Keep pending, required-action, paid, failed, canceled, and fulfilled states
distinct and repeat the safest next action returned by the service.

The consumer profile is intentionally cross-merchant and organizationless. It
must expose only `search_products`, `get_product`, `create_checkout`, and
`get_purchase_status`. If any merchant-administration tool is visible, stop and
report a profile isolation failure rather than using it.
