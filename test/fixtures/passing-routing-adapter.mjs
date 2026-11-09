let source = "";

for await (const chunk of process.stdin) source += chunk;
const input = JSON.parse(source);
const { expectation } = input.case;

const clarified = expectation.mode === "include_or_clarify";
const excluded = expectation.mode === "exclude";
const selectedUnits = clarified || excluded ? [] : expectation.units;

process.stdout.write(JSON.stringify({
  protocol_version: 1,
  outcome: clarified || excluded ? "clarified" : "selected",
  selected_units: selectedUnits,
  usage: {
    source: "host",
    input_tokens: 40,
    output_tokens: 10,
    total_tokens: 50
  },
  model_latency_ms: 12.5,
  semantic_outcome: "not_applicable",
  tool_calls: [],
  trace_id: `fixture-${input.case.id}`
}));
