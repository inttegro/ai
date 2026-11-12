# Inttegro AI evaluations

The public AI package treats routing, tool coverage, and behavioral MCP calls
as versioned contracts. These checks do not pretend to measure model quality by
themselves; they make expected behavior explicit and provide stable inputs for
host-specific model evaluations.

## Static gates

```bash
node scripts/validate-tool-coverage.mjs
node scripts/validate-tool-call-evals.mjs
node scripts/validate-skill-routing.mjs
```

The tool check requires every MCP tool in each committed profile to appear in
at least one compatible workflow. It also prevents the consumer workflow from
referencing merchant tools.

The routing check requires positive, negative, and ambiguous prompts for every
skill and agent, plus cases that exercise the most easily confused boundaries.

The tool-call check validates the synthetic behavioral corpus against every
committed MCP profile and tool name. The corpus focuses on names, arguments,
ordering, forbidden calls, recovery, and confirmation boundaries. It does not
claim behavioral coverage for all 84 tools; the static workflow gate remains
the exhaustive catalog check.

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
  npx @inttegro/ai doctor \
  --token-env INTTEGRO_TEST_TOKEN --json > /tmp/inttegro-mcp-report.json

node scripts/validate-tool-coverage.mjs \
  --profile merchant --live-report /tmp/inttegro-mcp-report.json
```

The doctor never invokes a tool and never includes the token in its report.
Use an account and OAuth client whose expected profile matches `--profile`.

## Execute the model evaluations

`@inttegro/ai` runs this corpus through a provider- or host-specific
adapter and produces a consistent JSONL artifact:

```bash
npx @inttegro/ai eval routing \
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
[routing protocol](../docs/routing-evaluations.md) before implementing an
adapter.

Run the MCP behavior corpus through a headless host adapter:

```bash
npx @inttegro/ai eval tools \
  --adapter node \
  --adapter-arg /absolute/path/to/your-host-adapter.mjs \
  --provider your-provider \
  --model your-model \
  --host your-host \
  --host-version your-host-version \
  --plugin-revision "$(git rev-parse HEAD)" \
  --execution-region not_recorded \
  --output /tmp/inttegro-tool-call-eval.jsonl
```

The tool runner supplies the active profile's catalog and sanitized synthetic
tool fixtures. It scores the observable transcript and final state without
coupling the repository to a provider SDK. See the
[tool-call protocol](../docs/tool-call-evaluations.md) before implementing an
adapter.

Do not report static validation or a passing fixture adapter as model-evaluation
evidence. Every executable run records provider, model, host version, plugin
revision, locale, execution region, token-usage provenance, wall and model
latency, tool sequence, tool arguments, tool latency, and semantic outcome.
Unavailable measurements remain explicitly `null`; the runner never converts
missing evidence into zero. Do not store chain-of-thought, credentials,
customer data, or raw production tool payloads in evaluation artifacts.
