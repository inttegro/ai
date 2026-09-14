# Inttegro AI

[![skills.sh](https://skills.sh/b/inttegro/ai)](https://skills.sh/inttegro/ai)

Open-source tools for bringing Inttegro into AI applications and agent workflows.

This repository is the public home for Inttegro agent plugins, reusable skills, protocol integrations, examples, and libraries that are useful beyond a single product or model provider. Host-specific packages stay thin: business logic, tenant isolation, and authorization policy remain in Inttegro's shared services.

## Projects

| Project | Description | Status |
| --- | --- | --- |
| [Inttegro agent plugin](plugins/inttegro) | Portable Agent Plugins package with live Inttegro tools, eight developer skills, twelve internal merchant workflows, five specialist agents, and MCP Apps metadata. | Public source; directory reviews pending |
| [Developer skills](skills) | Integration, Checkout, reliability, testing, debugging, upgrade, and MCP guidance for coding agents. | [Published on skills.sh](https://skills.sh/inttegro/ai) |
| [MCP Registry metadata](registry) | Public discovery metadata for the hosted Inttegro MCP server. | Ready for namespace verification and publication |
| [`@inttegro/mcp-doctor`](packages/mcp-doctor) | Read-only OAuth, endpoint protection, and authenticated tool-catalog diagnostics. | Available from source |

## Inttegro MCP

Inttegro hosts a remote Model Context Protocol server at:

```text
https://mcp.inttegro.com/
```

Compatible clients authenticate with OAuth. The service checks the selected organization, membership, and granular Inttegro scopes on every request. API keys remain a separate workload credential for headless integrations and should never be pasted into an interactive AI conversation.

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
- `skills/` — public developer skills for building and maintaining Inttegro integrations.
- `packages/` — libraries and protocol adapters suitable for independent versioning.
- `examples/` — small, runnable examples built on public Inttegro interfaces.
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
