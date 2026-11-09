# Inttegro AI evaluations

The public AI package treats routing and tool coverage as versioned contracts.
These checks do not pretend to measure model quality by themselves; they make
the expected behavior explicit and provide stable inputs for host-specific
model evaluations.

## Static gates

```bash
node scripts/validate-tool-coverage.mjs
node scripts/validate-skill-routing.mjs
```

The tool check requires every MCP tool in each committed profile to appear in
at least one compatible workflow. It also prevents the consumer workflow from
referencing merchant tools.

The routing check requires positive, negative, and ambiguous prompts for every
skill and agent, plus cases that exercise the most easily confused boundaries.

Inside the Commerce workspace, compare the contract directly with the runtime
source:

```bash
node scripts/validate-tool-coverage.mjs \
  --runtime-source ../mcp/src/tools/catalog.ts
```

## Compare a live catalog

Create a redacted report with a short-lived test OAuth token:

```bash
INTTEGRO_TEST_TOKEN=replace_me \
  node packages/mcp-doctor/bin/inttegro-mcp-doctor.mjs \
  --token-env INTTEGRO_TEST_TOKEN --json > /tmp/inttegro-mcp-report.json

node scripts/validate-tool-coverage.mjs \
  --profile merchant --live-report /tmp/inttegro-mcp-report.json
```

The doctor never invokes a tool and never includes the token in its report.
Use an account and OAuth client whose expected profile matches `--profile`.

## Execute the model evaluation

`@inttegro/routing-evals` runs this corpus through a provider- or host-specific
adapter and produces a consistent JSONL artifact:

```bash
node packages/routing-evals/bin/inttegro-routing-eval.mjs \
  --adapter node \
  --adapter-arg /absolute/path/to/your-host-adapter.mjs \
  --provider your-provider \
  --model your-model \
  --host your-host \
  --host-version your-host-version \
  --plugin-revision "$(git rev-parse HEAD)" \
  --execution-region not_recorded \
  --output /tmp/inttegro-routing-eval.jsonl
```

The runner supplies the full installed skill and agent catalog so the host is
tested under realistic routing pressure. It scores positive, negative,
ambiguous, and exact overlap cases, records repetitions, and exits nonzero when
the configured minimum score is missed or an adapter fails. See the
[package protocol](../packages/routing-evals/README.md) before implementing an
adapter.

Do not report static validation as model-evaluation evidence. Every executable
run records provider, model, host version, plugin revision, locale, execution
region, token-usage provenance, wall and model latency, selected units, tool
sequence, tool latency, and semantic outcome. Unavailable measurements remain
explicitly `null`; the runner never converts missing evidence into zero. Do not
store chain-of-thought, credentials, customer data, or raw production tool
payloads in evaluation artifacts.
