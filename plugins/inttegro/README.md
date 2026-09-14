# Inttegro agent plugin

This plugin connects Claude, ChatGPT, Codex, GitHub Copilot, VS Code, and other
compatible agent hosts to the shared Inttegro MCP service. It combines live,
account-scoped commerce tools with merchant workflow skills, read-only Claude
specialists, and portable MCP Apps metadata.

## What merchants can do

- Understand orders, products, customers, balances, balance activity, payouts, payment settings, messages, and sales performance.
- Create customers, orders, products, prices, and hosted buy links.
- Take confirmed payments using masked saved-payment choices or secure Inttegro Checkout.
- Guide line-item refunds from current availability through asynchronous reconciliation.
- Create, preview, publish, archive, and safely send reusable SMS or email templates.
- Upload, inspect, intentionally share, revoke, and delete files without exposing ordinary file bytes or reusable capability URLs in reads.
- Produce credential-free SDK and checkout integration plans.
- Show product, order, analytics, catalog, and buy-link results as portable MCP Apps cards in compatible hosts.

The plugin never asks for raw card details, OTP codes, or an Inttegro API key in chat. It cannot browse an address book, expose raw customer contact details, move balances, or bypass a confirmation required by the service.

## Included components

- A root `plugin.json` and `mcp.json` using the portable Agent Plugins 1.0 format.
- Eight public developer skills synchronized from the repository-root `skills/` directory.
- Twelve authenticated merchant workflows marked internal so they ship with the plugin without appearing in skills.sh discovery.
- Five Claude specialists: two read-only investigators plus action-capable sales, order-operations, and customer-resolution operators.
- One Streamable HTTP MCP connection to `https://mcp.inttegro.com/`; the
  Claude-compatible `.mcp.json` also carries its registered public OAuth client.
- Compatibility metadata and artwork for Claude and OpenAI plugin hosts.

## Authentication

Interactive users connect through OAuth 2.1. The MCP resource server advertises its authorization server and checks token audience, expiry, selected organization, membership, and tool scopes on every request. The packaged Claude connection is a public client that uses PKCE and a fixed localhost callback; it contains no client secret.

## Claude development

From the repository root:

```bash
npx -y @anthropic-ai/claude-code@2.1.269 plugin validate plugins/inttegro --strict
npx -y @anthropic-ai/claude-code@2.1.269 --plugin-dir ./plugins/inttegro
```

Inside Claude Code, open `/mcp` and complete Inttegro sign-in. Run `/help` to see the developer and authenticated merchant skills. Read-only specialists are available as `@inttegro:commerce-analyst` and `@inttegro:customer-journey-investigator`; outcome operators are `@inttegro:sales-closer`, `@inttegro:order-operations-manager`, and `@inttegro:customer-resolution-specialist`.

## Other MCP hosts

Agent Plugins 1.0 hosts can consume this package through repository marketplace
metadata or a packaged release. Compatible MCP clients can also connect directly
to:

```text
https://mcp.inttegro.com/
```

Executable commerce logic and authorization policy remain on the shared Inttegro service rather than being duplicated for a particular host.

The portable manifest relies on OAuth protected-resource discovery and contains
no bearer token, API key, or reusable merchant credential.

## Support

- [Documentation](https://studio.inttegro.dev/inttegro-mcp)
- [Privacy policy](https://inttegro.com/privacy)
- [Terms of service](https://inttegro.com/terms)
- [Product support](mailto:support@inttegro.com)
