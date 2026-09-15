# Integration paths

These are layers, not four mutually exclusive choices. An application may use an official SDK or direct HTTPS on its trusted server to create an order, then send its customer to hosted Checkout. MCP serves authenticated agent and operator workflows rather than replacing that server integration.

## Trusted-server transport: official SDK

Prefer a released official SDK when the project's trusted server runtime is supported. Confirm the current package and version on [Inttegro SDKs](https://studio.inttegro.dev/sdks) before changing dependencies. Use the language guide for installation, typed errors, tracing, and error reporting.

Do not add a server SDK to browser-only code. Swift, Dart, Rust, and Elixir may be source previews rather than registry releases; verify the current guide before promising package-manager installation.

## Trusted-server transport: direct HTTPS

Use direct HTTPS when the runtime lacks a released SDK, the project intentionally keeps dependencies minimal, or the required operation is not available in its installed SDK. The production origin is `https://api.inttegro.com`; authenticate with `Authorization: Bearer $INTTEGRO_API_KEY` from the trusted server.

Generate or narrow a client from the current [API reference](https://studio.inttegro.dev/api), not from remembered fields. Preserve the structured error envelope and the `X-Request-Id` response header.

## Customer payment surface: hosted Checkout

Prefer hosted Checkout when a customer needs to pay and the product does not require an embedded payment UI. The server creates and finalizes the order, stores its ID, and sends the customer to the returned invoice web URL. The application looks up the order after return; a redirect is never payment proof.

Start with [Inttegro Checkout](https://studio.inttegro.dev/products/checkout) and [Accept payment with Inttegro Checkout](https://studio.inttegro.dev/guides/accept-payment-with-inttegro-checkout).

## Customer payment surface: custom checkout

Choose a custom checkout only when the payment UI must remain embedded or the business flow cannot leave the application. Keep all API calls and secrets on the server, model payment as an asynchronous state machine, and expose only the minimum client-safe state. Verify the exact payment and confirmation contract in the API reference before implementation.

## Agent and operator surface: MCP

Use MCP for authenticated agent workflows, integration planning, operator tools, or an MCP App surface. It is not a replacement for an application backend or customer checkout. Connect to the origin-root Streamable HTTP endpoint `https://mcp.inttegro.com` and read [MCP documentation](https://studio.inttegro.dev/inttegro-mcp).

## First-slice examples

| Goal | Smallest complete slice |
| --- | --- |
| Hosted payment | Create finalized order -> store order ID -> redirect to invoice URL -> look up order -> fulfill only when paid |
| Orders and invoices | Create finalized order -> store ID and invoice URL -> deliver through the application's trusted channel -> look up state |
| Catalog and Buy links | Create or select product -> create or select price -> create purchase intent -> store and present its hosted URL |
| Operational integration | Read by ID for live work -> page recent resources for bounded reconciliation -> persist sync cursor or checkpoint |
| Agent workflow | Connect MCP with OAuth or restricted workload credentials -> verify the authorized catalog -> keep writes behind Inttegro confirmation |
