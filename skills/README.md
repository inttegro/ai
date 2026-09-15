# Inttegro developer skills

These public skills help coding agents build, test, debug, and upgrade Inttegro
integrations. They work from public contracts and do not require access to a
merchant account. Authenticated operational workflows are bundled separately
inside the Inttegro plugin and marked internal so skills.sh does not present
them as developer integrations.

| Skill | Use it for |
| --- | --- |
| `inttegro` | Choose and implement an API, SDK, Checkout, or MCP integration path |
| `inttegro-best-practices` | Authentication, money, idempotency, retries, pagination, privacy, and observability |
| `inttegro-checkout` | Hosted Checkout, redirects, authoritative payment state, and fulfillment boundaries |
| `inttegro-state-sync` | Lookup, bounded polling, and reconciliation for resource status updates; Inttegro does not yet offer merchant webhooks |
| `inttegro-testing` | Contract, failure, idempotency, Checkout, and end-to-end test coverage |
| `inttegro-debug` | Evidence-led diagnosis of API, SDK, Checkout, and MCP failures |
| `upgrade-inttegro` | Safe SDK, generated-client, and API contract migrations |
| `inttegro-mcp` | Remote MCP setup, authentication, capability handling, and MCP-powered apps |

## Install with the skills CLI

Install the collection:

```bash
npx skills add inttegro/ai
```

Install one workflow:

```bash
npx skills add inttegro/ai --skill inttegro-checkout
```

The public catalog is available at
[skills.sh/inttegro/ai](https://skills.sh/inttegro/ai).

## Install one skill from a clone

Copy the complete skill directory into a supported project or user skills
location. For example:

```bash
cp -R skills/inttegro-checkout /path/to/project/.agents/skills/
```

Use `.claude/skills/` or `.github/skills/` instead when that is the host's
documented project location. Review skill instructions before installing them.
No skill contains credentials or depends on private merchant data. When an
integration uses MCP, Inttegro's server-side authorization and confirmation
controls remain authoritative.
