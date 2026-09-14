---
name: inttegro-checkout
description: Build or review an Inttegro Checkout integration. Use when a developer needs hosted payment pages, finalized orders, invoice URLs, success and cancellation redirects, payment-status verification, Buy links, or a decision between hosted and custom checkout.
---

# Inttegro Checkout

Use hosted Checkout as the default customer payment surface unless the product has a concrete requirement for an embedded flow.

## Choose the architecture

Use hosted Checkout when the product can redirect or link customers to an Inttegro-hosted payment page. It reduces the payment UI and credential-handling surface while Inttegro manages supported methods and confirmation.

Choose custom checkout only when the payment UI must remain embedded or the product requires business steps that hosted Checkout cannot represent. A custom UI does not move API calls or secrets into the client; it increases the server-side state-machine work.

## Implement hosted Checkout

1. Create the order from trusted server code with customer data and line items. Send a stable `Idempotency-Key` and set `finalize: true`.
2. Store `order.id` with the local cart or transaction before returning a response to the client.
3. Extract the hosted invoice web URL from the returned order contract. Treat the URL as sensitive customer data because it can be viewed without the API key.
4. Configure `checkout_settings.redirect_url` and `checkout_settings.cancel_url` to routes owned by the application.
5. Redirect the customer or deliver the link through a trusted channel. Do not put the API key or an order-creation call in the browser.
6. On return, use the stored order ID to look up the current order. Never accept a query parameter, redirect, or client assertion as proof of payment.
7. Fulfill only after authoritative state says the order is paid. Mark the order completed only after the application has actually fulfilled it.

Read [implementation and state](references/implementation-and-state.md) for lifecycle and recovery rules. Use the exact fields from [Accept payment with Inttegro Checkout](https://studio.inttegro.dev/guides/accept-payment-with-inttegro-checkout) and [Orders](https://studio.inttegro.dev/api/orders).

## Test the complete journey

Cover order creation, replay with the same idempotency key, redirect construction, cancellation return, pending payment, required customer action, successful payment, duplicate return visits, authoritative lookup failure, and fulfillment idempotency. Do not call the integration complete based only on a rendered checkout page.
