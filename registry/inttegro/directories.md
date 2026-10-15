# Inttegro MCP directory submission kit

Use this document as the source of truth when submitting Inttegro's hosted MCP
server to registries and directories. Keep directory-specific wording accurate,
but do not introduce capabilities that are absent from the server.

## Canonical listing

| Field | Value |
| --- | --- |
| Name | Inttegro |
| Registry name | `com.inttegro/mcp` |
| Version | `0.1.0` |
| Endpoint | `https://mcp.inttegro.com/` |
| Transport | Streamable HTTP |
| Authentication | OAuth 2.1 |
| Website | `https://studio.inttegro.dev/inttegro-mcp` |
| Icon | `https://studio.inttegro.dev/img/inttegro-logo.png` |
| Source and public resources | `https://github.com/inttegro/ai` |
| Privacy | `https://inttegro.com/privacy` |
| Terms | `https://inttegro.com/terms` |
| Security | `https://inttegro.com/security` |
| Support | `support@inttegro.com` |
| Service region | Ghana |

## Short description

Operate an Inttegro merchant account with authenticated commerce tools and
confirmed actions.

## Full description

Inttegro is a commerce and payments platform for businesses in Ghana. Its
hosted MCP server lets authenticated merchants work with orders, customers,
products, prices, buy links, files, invoices, receipts, messages, balances,
payouts, and analytics from compatible AI clients. Access is scoped to the
selected Inttegro organization, and state-changing operations use explicit
confirmation and idempotency controls. Connect to the remote Streamable HTTP
endpoint with OAuth; no local server installation is required.

## Categories and keywords

- Categories: commerce, payments, business operations
- Keywords: Inttegro, commerce, payments, orders, products, customers, buy
  links, invoices, receipts, messaging, balances, payouts, analytics, Ghana

## Client configuration

```json
{
  "mcpServers": {
    "inttegro": {
      "url": "https://mcp.inttegro.com/"
    }
  }
}
```

The client must support remote Streamable HTTP servers and the server's OAuth
authorization flow.

## Submission order

1. Publish `server.json` to the official MCP Registry after authenticating the
   `com.inttegro` namespace.
2. Verify downstream discovery in directories that ingest the official
   registry before creating duplicate manual listings.
3. Submit the canonical listing to community directories that require a form
   or pull request.
4. Submit to client-specific marketplaces only after completing a fresh OAuth
   connection and tool-call smoke test in that client.

## Submission matrix

| Destination | Submission path | Current state | Next action |
| --- | --- | --- | --- |
| Official MCP Registry | `mcp-publisher publish registry/inttegro/server.json` | Published as `com.inttegro/mcp` version `0.1.0`; the public registry API returns the listing | Use a new version for future metadata changes; registry versions are immutable |
| Registry consumers | Automatic ingestion from the official registry | The upstream listing is available for ingestion | Verify downstream discovery before creating duplicate manual listings |
| Glama | `https://glama.ai/mcp/connectors` | The endpoint is compatible, but Inttegro does not expose dynamic client registration | Submit as an OAuth connector and provide a dedicated review connection; link it to the official registry entry |
| Smithery | `https://smithery.ai/servers/new` | Sign-in and a manual publish flow are required | Submit the public repository, canonical endpoint, and listing copy |
| mcp.so | `https://mcp.so/submit?type=server` | Manual form; paid expedited publication is optional | Use the public repository and remote-server configuration without purchasing placement unless separately approved |
| Cursor | `https://cursor.com/marketplace/publish` | The public Agent Plugin package exists and validates locally | Submit `https://github.com/inttegro/ai/tree/master/plugins/inttegro` for review |
| Claude | `https://claude.ai/directory/manage/new` | A Claude package and pre-registered public OAuth client exist | Run a fresh Claude OAuth and read-only-tool smoke test, then submit the single MCP connector or plugin bundle |
| ChatGPT and Codex | `https://platform.openai.com/plugins` | The package has icons and listing metadata, but the MCP manifest does not yet declare a ChatGPT review OAuth client | Register the review client and callback, add the `com.openai` OAuth manifest extension, validate the ZIP, connect and scan tools, then submit for review |

Directory submission is not a substitute for client compatibility. Record the
result of OAuth, tool discovery, one read-only call, and one confirmation-safe
write flow for each client-specific marketplace before submission.

## Publication gates

- `https://mcp.inttegro.com/readyz` reports ready.
- `server.json` passes the repository validator and the live registry validator.
- The `com.inttegro` namespace is authenticated through the official registry's
  DNS method with a Google Cloud KMS signing key.
- The registry version matches the deployed MCP release version.
- A new user can complete OAuth and call a read-only tool from an external MCP
  client.
- Any reviewer credentials grant access only to a dedicated review account with
  non-sensitive data.

Publishing the registry entry, submitting directory forms, granting review
access, and changing DNS are external actions. Review the exact payload and
obtain explicit authorization immediately before each action.
