let source = "";

for await (const chunk of process.stdin) source += chunk;
const input = JSON.parse(source);
const { expectation } = input.case;

process.stdout.write(JSON.stringify({
  protocol_version: 1,
  outcome: expectation.outcome,
  usage: {
    source: "host",
    input_tokens: 60,
    output_tokens: 15,
    total_tokens: 75
  },
  model_latency_ms: 18.25,
  semantic_outcome: expectation.outcome === "refused"
    ? "not_applicable"
    : expectation.outcome === "awaiting_confirmation" ? "partial" : "success",
  tool_calls: expectation.calls.map((call) => ({
    name: call.name,
    arguments: call.arguments,
    latency_ms: 2.5,
    outcome: call.tool_outcome
  })),
  trace_id: `fixture-${input.case.id}`
}));
