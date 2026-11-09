# Inttegro AI

[![skills.sh](https://skills.sh/b/inttegro/ai)](https://skills.sh/inttegro/ai)

Open-source tools for bringing Inttegro into AI applications and agent workflows.

This repository is the public home for Inttegro agent plugins, reusable skills, protocol integrations, examples, and libraries that are useful beyond a single product or model provider. Host-specific packages stay thin: business logic, tenant isolation, and authorization policy remain in Inttegro's shared services.

## Projects

| Project | Description | Status |
| --- | --- | --- |
| [Inttegro agent plugin](plugins/inttegro) | Portable Agent Plugins package with live Inttegro tools, eight developer skills, twelve internal merchant workflows, ten specialist agents, and MCP Apps metadata. | Public source; directory reviews pending |
| [Developer skills](skills) | Integration, Checkout, reliability, testing, debugging, upgrade, and MCP guidance for coding agents. | [Published on skills.sh](https://skills.sh/inttegro/ai) |
| [MCP Registry metadata](registry) | Public discovery metadata for the hosted Inttegro MCP server. | Ready for namespace verification and publication |
| [`@inttegro/ai`](package.json) | One CLI for read-only MCP diagnostics and maintainer routing evaluations. | Source release |
| [Inttegro for Visual Studio Code](extensions/vscode) | Registers the hosted MCP server and provides connectivity and developer-navigation commands. | Source release |
| [Shop with Inttegro](products/shop-with-inttegro) | Consumer product discovery, authoritative product hydration, secure Checkout handoff, and minimized purchase status. | Activation-gated; not installable yet |
| [AI evaluation contracts](evals) | Versioned skill and agent routing cases plus MCP profile tool-coverage gates. | Enforced in CI |

## Inttegro MCP

Inttegro hosts a remote Model Context Protocol server at:

```text
https://mcp.inttegro.com/
```

Compatible clients authenticate with OAuth. The service checks the selected organization, membership, and granular Inttegro scopes on every request. API keys remain a separate workload credential for headless integrations and should never be pasted into an interactive AI conversation.

### Connect an MCP client

Use the hosted Streamable HTTP endpoint; there is no local server to install:

```json
{
  "mcpServers": {
    "inttegro": {
      "url": "https://mcp.inttegro.com/"
    }
  }
}
```

Open the connection in a compatible client and complete the Inttegro OAuth
flow. The tools then operate on the organization selected during authorization.
See the [connection guide](plugins/inttegro/README.md) for supported client
packages and usage guidance.

### Diagnose an MCP connection

The single `@inttegro/ai` package provides the public command-line surface:

```bash
npx @inttegro/ai doctor
```

Use a short-lived test-organization OAuth token with `--token-env` when the
diagnostic report must include authenticated tool discovery. The CLI never
accepts a token value as an argument and never invokes a merchant tool. See the
[MCP doctor guide](docs/mcp-doctor.md) for the complete options.

## Install Inttegro skills

Install the full Inttegro developer skill collection with the open-source `skills` CLI:

```bash
npx skills add inttegro/ai
```

To install one skill, select it explicitly:

```bash
npx skills add inttegro/ai --skill inttegro-checkout
```

Browse the complete collection at [skills.sh/inttegro/ai](https://skills.sh/inttegro/ai).

## Install the Claude plugin

```bash
claude plugin marketplace add inttegro/ai
claude plugin install inttegro@inttegro
```

Then open `/mcp` in Claude Code and complete Inttegro sign-in.

## Repository structure

- `plugins/` — installable agent plugins and their host manifests.
- `products/` — product-level AI experiences and their activation contracts.
- `skills/` — public developer skills for building and maintaining Inttegro integrations.
- `bin/` and `src/` — the single `@inttegro/ai` command-line package.
- `extensions/` — host-native developer integrations that add capabilities beyond a registry listing.
- `examples/` — small, runnable examples built on public Inttegro interfaces.
- `contracts/` — versioned MCP profile and capability contracts.
- `evals/` — routing and tool-coverage evaluation inputs.
- `.claude-plugin/` and `.codex-plugin/` — marketplace metadata for supported hosts.
- `registry/` — versioned discovery metadata for the official MCP Registry.
- `scripts/` — dependency-free consistency and package validation.

The hosted Inttegro platform, customer data, credentials, and internal operational tooling do not belong in this repository.

## Development

Validate the current Claude marketplace and Inttegro plugin with:

```bash
npx -y @anthropic-ai/claude-code@2.1.269 plugin validate . --strict
npx -y @anthropic-ai/claude-code@2.1.269 plugin validate plugins/inttegro --strict
```

See [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change. Security issues should be reported privately as described in [SECURITY.md](SECURITY.md).

## License

Unless a subdirectory says otherwise, this repository is available under the [MIT License](LICENSE).
