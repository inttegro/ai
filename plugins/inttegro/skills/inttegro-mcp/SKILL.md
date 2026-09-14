---
name: inttegro-mcp
description: Connect, configure, build, or debug an Inttegro Model Context Protocol integration. Use when a developer is adding the remote MCP server to an agent client, choosing OAuth or workload authentication, building MCP-powered applications, consuming structured results or MCP Apps, or handling confirmation and client-capability differences.
---

# Inttegro MCP

Use MCP for authenticated agent and operator workflows. Keep the application API and customer checkout boundaries separate.

## Connect correctly

1. Use the complete origin-root Streamable HTTP URL `https://mcp.inttegro.com`. Do not append `/mcp` or substitute a hosting-provider URL.
2. Prefer OAuth for interactive users and organization selection. Use a restricted Inttegro API key only for an intentional workload connection, loaded from protected environment or client secret storage.
3. Never paste a client secret, API key, customer record, or payment credential into chat, a repository config, or a client-visible header field.
4. After authentication, inspect the authorized tool catalog and verify the selected organization with a harmless read. Do not infer access from a successful OAuth redirect alone.
5. Resync or reconnect after a server catalog or scope change.

Read [client and application boundaries](references/client-and-application-boundaries.md) and the current [Connect an MCP client](https://studio.inttegro.dev/inttegro-mcp/connect) instructions for the target host.

## Build with the protocol boundary

- Use exact tool schemas discovered from the connected server. Do not hard-code undocumented arguments or depend on a remembered tool count.
- Treat structured tool output as the portable contract. MCP Apps and rich cards are optional presentation surfaces; clients that ignore them must still receive usable structured data.
- Keep read tools read-only. A host's generic approval is not a substitute for Inttegro's required action confirmation.
- Detect form elicitation support before relying on an inline form. For clients without elicitation, use Inttegro's secure hosted confirmation flow when the server provides it; never implement a confirmation bypass.
- Preserve request, confirmation, and resource identifiers needed to review or reconcile actions later, while keeping reusable capability URLs out of general logs.
- Let the server enforce organization membership and scopes. Client-side hiding is usability, not authorization.

## Use MCP integration guidance

When an Inttegro connection is already available, `design_integration`, `get_integration_guide`, and `check_integration_readiness` can provide current, credential-free architecture guidance. Preserve their structured plan and Studio links, then inspect and modify the actual repository yourself. The tools do not inspect source code, deploy an app, or prove live traffic.

## Verify

Test endpoint discovery, authentication failure, organization selection, authorized catalog, one harmless read, structured output without rich UI, confirmation behavior in the target client, token refresh or workload-secret handling, and reconnect after a catalog change. Report client capabilities separately from server capabilities.
