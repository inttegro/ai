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

## Model evaluation

Host-specific runners should load `routing.json`, expose only the unit under
test and its real neighboring units, and record whether the host activates or
delegates as expected. Score the ambiguous cases separately: some correctly
require a brief clarification, while the overlap cases declare when more than
one route is expected.

Do not report static validation as model-evaluation evidence. Record provider,
model, host version, plugin revision, locale, execution region, token usage,
latency, selected units, tool sequence, and semantic outcome for every run.
