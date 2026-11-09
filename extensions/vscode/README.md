# Inttegro for Visual Studio Code

Build and operate Inttegro commerce integrations without leaving your editor.

The extension registers Inttegro's hosted Model Context Protocol server with
Visual Studio Code. Copilot and other compatible agent harnesses can then use
the Inttegro tools enabled for your account to work with products, prices,
customers, orders, payments, checkout, messaging, files, and merchant
operations.

## Connect

1. Install the extension.
2. Open **MCP: List Servers** from the command palette.
3. Start **Inttegro** and complete the Inttegro OAuth flow.
4. Ask your agent to use Inttegro for a read-only task, then inspect the tool
   call before allowing writes.

The extension connects to `https://mcp.inttegro.com/`. It does not request or
store API keys. Authorization is handled by the MCP client's OAuth flow.

## Commands

- **Inttegro: Check MCP service** verifies that the public protected-resource
  metadata is reachable and advertises OAuth.
- **Inttegro: Open developer documentation** opens the MCP integration guide.
- **Inttegro: Open Studio** opens Inttegro Studio.

## Security and privacy

The extension does not collect telemetry. The service check sends an explicit,
unauthenticated request to Inttegro's public OAuth metadata endpoint. Inttegro
MCP tool calls are governed by the scopes selected during sign-in and the
confirmation behavior of the active agent client.

See [SUPPORT.md](SUPPORT.md) for help and [Inttegro's privacy
policy](https://inttegro.com/privacy) for the hosted service.
