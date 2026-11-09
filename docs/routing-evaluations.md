# Routing evaluations

Run Inttegro's versioned skill and agent routing corpus through a real model or
host without coupling the public repository to one provider SDK.

The runner executes an adapter command once per case. It sends one JSON request
on standard input and accepts one JSON result on standard output. This keeps
provider credentials inside the adapter process while giving every host the
same corpus, scoring rules, provenance fields, and JSONL output.

## Run an evaluation

From the Inttegro AI repository:

```bash
npx @inttegro/ai eval routing \
  --adapter node \
  --adapter-arg /absolute/path/to/your-host-adapter.mjs \
  --provider anthropic \
  --model your-model-id \
  --host claude-code \
  --host-version your-host-version \
  --plugin-revision "$(git rev-parse HEAD)" \
  --execution-region not_recorded \
  --output /tmp/inttegro-routing-eval.jsonl
```

Use `--kind`, `--case-type`, or `--unit` to run a focused slice. Use
`--repetitions` to measure variance. The default minimum score is `1`; lower it
explicitly when collecting a baseline rather than enforcing a gate.

The runner provides the full installed candidate catalog for every case. This
tests the same routing pressure a host sees when all Inttegro units are
available instead of making a target artificially easy to select.

## Adapter request

The adapter receives a protocol-versioned request:

```json
{
  "protocol_version": 1,
  "run_id": "3d83f98c-90b7-44ca-92ab-a5537a2d2cd5",
  "case": {
    "id": "skill:checkout:positive:1",
    "kind": "skill",
    "case_type": "positive",
    "target": "checkout",
    "prompt": "Implement hosted Inttegro Checkout...",
    "expectation": {
      "mode": "include",
      "units": ["checkout"]
    }
  },
  "repetition": 1,
  "candidate_catalog": [
    {
      "kind": "skill",
      "name": "checkout",
      "description": "Build or review an Inttegro Checkout integration...",
      "source": "plugins/inttegro/skills/checkout/SKILL.md"
    }
  ],
  "metadata": {
    "provider": "anthropic",
    "model": "your-model-id",
    "host": "claude-code",
    "host_version": "your-host-version",
    "plugin_revision": "your-git-sha",
    "locale": "en-US",
    "execution_region": "not_recorded"
  }
}
```

An adapter may exercise a host's native plugin router or implement an isolated
classification call using the supplied candidate names and descriptions. It
must not return model chain-of-thought. Put diagnostic logs on standard error;
standard output is reserved for the result object.

## Adapter result

Return exactly one JSON object:

```json
{
  "protocol_version": 1,
  "outcome": "selected",
  "selected_units": ["checkout"],
  "usage": {
    "source": "provider",
    "input_tokens": 1220,
    "output_tokens": 48,
    "total_tokens": 1268
  },
  "model_latency_ms": 842.4,
  "semantic_outcome": "not_applicable",
  "tool_calls": [],
  "trace_id": "optional-provider-or-host-trace-id"
}
```

`outcome` is one of `selected`, `clarified`, `refused`, or `error`.
`semantic_outcome` is one of `success`, `partial`, `failure`, or
`not_applicable`. Each tool-call record has `name`, `latency_ms`, and an
`outcome` of `success`, `error`, `cancelled`, or `unknown`.

Do not invent measurements. If the provider or host does not expose token
usage, return:

```json
{
  "source": "unavailable",
  "input_tokens": null,
  "output_tokens": null,
  "total_tokens": null
}
```

Use `null` for unavailable model or tool latency. The runner records its own
wall time separately.

## Scoring

- Positive cases pass when the selected units include the target.
- Negative cases pass when the target is not selected.
- Ambiguous cases pass when the host selects the plausible target or asks for
  clarification.
- Overlap cases require the exact expected unit set, preventing both missed
  collaboration and gratuitous routing.

The JSONL artifact starts with a run record, contains one record per case and
repetition, and ends with a summary. It includes provider, model, host version,
plugin revision, locale, execution region, wall time, model latency, token
usage provenance, selected units, tool sequence, tool latency, and semantic
outcome. Output files are created with owner-only permissions.

## Safety

- Use test organizations and non-production fixtures for adapters that can
  invoke live tools.
- Keep provider keys and OAuth tokens in the adapter environment. Never place
  credentials in command arguments, prompts, or result artifacts.
- Do not store raw hidden reasoning, customer data, or tool payloads.
- Treat `not_recorded` and `unavailable` as evidence states, not zero values.
