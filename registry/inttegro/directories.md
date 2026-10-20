# Inttegro MCP directory submission kit

Use this document as the source of truth when submitting Inttegro's hosted MCP
server to registries and directories. Keep directory-specific wording accurate,
but do not introduce capabilities that are absent from the server.

## Canonical listing

| Field | Value |
| --- | --- |
| Name | Inttegro |
| Registry name | `com.inttegro/mcp` |
| Version | `0.1.1` |
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
| Official MCP Registry | `mcp-publisher publish registry/inttegro/server.json` | Version `0.1.1` adds the public `https://github.com/inttegro/ai` repository required by GitHub's registry review | Republish version `0.1.1`, verify the public registry response, then ask GitHub to rerun review 168176 |
| Registry consumers | Automatic ingestion from the official registry | The upstream listing is available for ingestion | Verify downstream discovery before creating duplicate manual listings |
| Glama | `https://glama.ai/mcp/connectors` | Not discoverable in Glama search as of 2026-10-17; adding a server requires an authenticated publisher account | Sign in with the approved publisher account, submit the canonical listing, and provide a dedicated OAuth review connection |
| Smithery | `https://smithery.ai/servers/new` | The publish route redirected to sign-in as of 2026-10-17 | Sign in with the approved publisher account and submit the public repository, canonical endpoint, and listing copy |
| mcp.so | `https://mcp.so/submit?type=server` | The submission form offered a $39 one-time paid listing as of 2026-10-17; no free submission route was visible | Leave unsubmitted until the listing fee is explicitly approved |
| Cursor | `https://cursor.com/marketplace/publish` | The public Agent Plugin package validates locally; marketplace publishing requires sign-in and publisher registration | Sign in with the approved publisher account and submit `https://github.com/inttegro/ai/tree/master/plugins/inttegro` for review |
| Claude | `https://claude.ai/directory/manage/new` | A Claude package and pre-registered public OAuth client exist; the directory submission route required reauthentication as of 2026-10-17 | Reauthenticate with the approved publisher account, run a fresh OAuth and read-only-tool smoke test, then submit the plugin bundle |
| ChatGPT and Codex | `https://platform.openai.com/plugins` | The public package now contains all four required listing URLs, icons, and interface metadata. The MCP manifest does not yet declare the registered OpenAI review client, and the publisher organization still needs payment, verification, and Apps Management access | Add the registered client under the MCP server's `extensions["com.openai"].auth` object, validate the ZIP, connect and scan tools, complete publisher prerequisites, then submit for review |

Directory submission is not a substitute for client compatibility. Record the
result of OAuth, tool discovery, one read-only call, and one confirmation-safe
write flow for each client-specific marketplace before submission.

## Publication gates

- `https://mcp.inttegro.com/readyz` reports ready.
- `server.json` passes the repository validator and the live registry validator.
- The public repository URL resolves and its README explains the hosted server,
  OAuth connection, configuration, and developer resources.
- The `com.inttegro` namespace is authenticated through the official registry's
  DNS method with a Google Cloud KMS signing key.
- A metadata change uses a new immutable registry version and preserves the
  deployed endpoint contract.
- A new user can complete OAuth and call a read-only tool from an external MCP
  client.
- Any reviewer credentials grant access only to a dedicated review account with
  non-sensitive data.

Publishing the registry entry, submitting directory forms, granting review
access, and changing DNS are external actions. Review the exact payload and
obtain explicit authorization immediately before each action.

## Host-specific manifest boundaries

The portable package deliberately keeps shared listing metadata in
`.codex-plugin/plugin.json` until the full OpenAI extension is ready. If
`plugin.json` gains `extensions.com.openai`, OpenAI treats that object as the
complete OpenAI overlay rather than merging it with `.codex-plugin/plugin.json`.
Do not add a partial extension.

OpenAI OAuth connection settings belong to the individual server entry in
`mcp.json`, under `extensions["com.openai"].auth`. They do not belong in the
listing extension in `plugin.json`. Inttegro currently needs a provided client
because the live Clerk authorization-server metadata does not advertise a
dynamic client-registration endpoint. Never invent or commit a placeholder
client ID as if it were usable.
