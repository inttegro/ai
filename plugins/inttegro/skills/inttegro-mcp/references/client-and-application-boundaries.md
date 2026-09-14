# Client and application boundaries

## Authentication choice

| Context | Preferred authentication | Storage |
| --- | --- | --- |
| Interactive user and organization | OAuth with authorization discovery and PKCE where supported | Host-managed token store |
| Headless workload | Restricted Inttegro API key | Workload secret manager or protected environment |
| Shared repository configuration | Reference an environment variable, never embed a token | No credential in repository |

OAuth clients differ in dynamic registration, fixed client registration, scope selection, refresh support, and organization-selection UX. Follow the target client's current Studio instructions rather than copying another host's configuration.

## Capability matrix

| Capability | If supported | If absent |
| --- | --- | --- |
| Streamable HTTP | Connect to the origin-root URL | Use another compatible client; do not downgrade to an undocumented endpoint |
| OAuth | Complete user and organization authorization | Use an intentional restricted workload key only if the client protects it |
| Form elicitation | Render the server-provided confirmation or input form | Use conversational typed inputs for read-only planning; use the server's hosted confirmation path for actions when available |
| MCP Apps | Render the declared resource UI | Display structured results in native client UI or text |
| Catalog refresh | Resync after changes | Reconnect the server |

## Application design

An MCP-powered app should keep three layers distinct:

1. The Inttegro server owns authentication, organization isolation, authorization, action confirmation, and commerce execution.
2. The agent host chooses tools and presents structured results or optional MCP Apps.
3. The developer application owns its local UI, session state, and any non-Inttegro side effects.

Do not mirror Inttegro authorization in prompt text. Do not treat a card renderer as evidence of a successful action. Re-read the authoritative resource after asynchronous or ambiguous operations.

Canonical documentation: [Inttegro MCP](https://studio.inttegro.dev/inttegro-mcp) and [Tool catalog](https://studio.inttegro.dev/inttegro-mcp/tools).
