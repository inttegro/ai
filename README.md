# Inttegro AI

Open-source tools for bringing Inttegro into AI applications and agent workflows.

This repository is the public home for Inttegro agent plugins, reusable skills, protocol integrations, examples, and libraries that are useful beyond a single product or model provider. Host-specific packages stay thin: business logic, tenant isolation, and authorization policy remain in Inttegro's shared services.

## Projects

| Project | Description | Status |
| --- | --- | --- |
| [Inttegro agent plugin](plugins/inttegro) | Commerce tools, nine merchant workflows, two read-only specialists, and portable MCP Apps metadata for Claude and OpenAI-compatible hosts. | Preparing for marketplace review |

## Inttegro MCP

Inttegro hosts a remote Model Context Protocol server at:

```text
https://mcp.inttegro.com/
```

Compatible clients authenticate with OAuth. The service checks the selected organization, membership, and granular Commerce scopes on every request. API keys remain a separate workload credential for headless integrations and should never be pasted into an interactive AI conversation.

## Install the Claude plugin

```bash
claude plugin marketplace add zebodotdev/ai
claude plugin install inttegro@inttegro
```

Then open `/mcp` in Claude Code and complete Inttegro sign-in.

## Repository structure

- `plugins/` — installable agent plugins and their host manifests.
- `skills/` — standalone, reusable agent skills that do not need a full plugin.
- `packages/` — libraries and protocol adapters suitable for independent versioning.
- `examples/` — small, runnable examples built on public Inttegro interfaces.
- `.claude-plugin/` and `.codex-plugin/` — marketplace metadata for supported hosts.

The hosted Commerce platform, customer data, credentials, and internal operational tooling do not belong in this repository.

## Development

Validate the current Claude marketplace and Inttegro plugin with:

```bash
npx -y @anthropic-ai/claude-code@2.1.269 plugin validate . --strict
npx -y @anthropic-ai/claude-code@2.1.269 plugin validate plugins/inttegro --strict
```

See [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change. Security issues should be reported privately as described in [SECURITY.md](SECURITY.md).

## License

Unless a subdirectory says otherwise, this repository is available under the [MIT License](LICENSE).
