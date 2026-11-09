import { randomUUID } from "node:crypto";


const outcomes = new Set(["selected", "clarified", "refused", "error"]);
const usageSources = new Set(["provider", "host", "unavailable"]);
const semanticOutcomes = new Set(["success", "partial", "failure", "not_applicable"]);
const toolOutcomes = new Set(["success", "error", "cancelled", "unknown"]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function nullableCount(value, field) {
  assert(value === null || (Number.isInteger(value) && value >= 0), `${field} must be a non-negative integer or null`);
}

function nullableDuration(value, field) {
  assert(value === null || (Number.isFinite(value) && value >= 0), `${field} must be a non-negative number or null`);
}

export function validateAdapterResult(value, candidateNames) {
  assert(value && typeof value === "object" && !Array.isArray(value), "adapter must return a JSON object");
  assert(value.protocol_version === 1, "adapter result must use protocol_version 1");
  assert(outcomes.has(value.outcome), `adapter returned unknown outcome ${value.outcome}`);
  assert(Array.isArray(value.selected_units), "adapter selected_units must be an array");
  assert(value.selected_units.every((name) => typeof name === "string"), "selected_units must contain strings");
  assert(new Set(value.selected_units).size === value.selected_units.length, "selected_units must not contain duplicates");
  const unknown = value.selected_units.filter((name) => !candidateNames.has(name));
  assert(unknown.length === 0, `adapter selected unknown units: ${unknown.join(", ")}`);

  assert(value.usage && typeof value.usage === "object", "adapter must report usage provenance");
  assert(usageSources.has(value.usage.source), `adapter returned unknown usage source ${value.usage.source}`);
  nullableCount(value.usage.input_tokens, "usage.input_tokens");
  nullableCount(value.usage.output_tokens, "usage.output_tokens");
  nullableCount(value.usage.total_tokens, "usage.total_tokens");
  if (value.usage.source === "unavailable") {
    assert(
      value.usage.input_tokens === null && value.usage.output_tokens === null && value.usage.total_tokens === null,
      "unavailable usage must use null token counts",
    );
  }
  if (
    value.usage.input_tokens !== null &&
    value.usage.output_tokens !== null &&
    value.usage.total_tokens !== null
  ) {
    assert(
      value.usage.input_tokens + value.usage.output_tokens === value.usage.total_tokens,
      "usage.total_tokens must equal input_tokens plus output_tokens",
    );
  }

  nullableDuration(value.model_latency_ms, "model_latency_ms");
  assert(semanticOutcomes.has(value.semantic_outcome), `unknown semantic_outcome ${value.semantic_outcome}`);
  assert(Array.isArray(value.tool_calls), "adapter tool_calls must be an array");
  for (const [index, call] of value.tool_calls.entries()) {
    assert(call && typeof call === "object", `tool_calls[${index}] must be an object`);
    assert(typeof call.name === "string" && call.name.length > 0, `tool_calls[${index}].name is required`);
    nullableDuration(call.latency_ms, `tool_calls[${index}].latency_ms`);
    assert(toolOutcomes.has(call.outcome), `tool_calls[${index}] has unknown outcome ${call.outcome}`);
  }
  if (value.trace_id !== undefined) {
    assert(typeof value.trace_id === "string" && value.trace_id.length > 0, "trace_id must be a non-empty string");
  }
  return value;
}

export function scoreRoutingResult(testCase, result) {
  const expected = new Set(testCase.expectation.units);
  const selected = new Set(result.selected_units);
  let passed = false;
  let reason;

  switch (testCase.expectation.mode) {
    case "include":
      passed = result.outcome === "selected" && [...expected].every((name) => selected.has(name));
      reason = passed ? undefined : `expected selection to include ${[...expected].join(", ")}`;
      break;
    case "exclude":
      passed = [...expected].every((name) => !selected.has(name));
      reason = passed ? undefined : `expected selection to exclude ${[...expected].join(", ")}`;
      break;
    case "include_or_clarify":
      passed = result.outcome === "clarified" || [...expected].every((name) => selected.has(name));
      reason = passed ? undefined : `expected clarification or selection of ${[...expected].join(", ")}`;
      break;
    case "exact":
      passed = result.outcome === "selected" &&
        selected.size === expected.size &&
        [...expected].every((name) => selected.has(name));
      reason = passed ? undefined : `expected exact selection ${[...expected].join(", ")}`;
      break;
    default:
      throw new Error(`Unknown expectation mode ${testCase.expectation.mode}`);
  }

  return { passed, ...(reason ? { reason } : {}) };
}

function adapterFailure(error) {
  return {
    protocol_version: 1,
    outcome: "error",
    selected_units: [],
    usage: {
      source: "unavailable",
      input_tokens: null,
      output_tokens: null,
      total_tokens: null,
    },
    model_latency_ms: null,
    semantic_outcome: "failure",
    tool_calls: [],
    error_kind: error instanceof Error && error.name ? error.name : "AdapterError",
  };
}

export async function runEvaluation({
  suite,
  cases = suite.cases,
  invoke,
  metadata,
  repetitions = 1,
  runId = randomUUID(),
} = {}) {
  assert(typeof invoke === "function", "runEvaluation requires an adapter invoke function");
  assert(Number.isInteger(repetitions) && repetitions >= 1, "repetitions must be a positive integer");
  const candidateNames = new Set(suite.units.map((unit) => unit.name));
  const records = [];

  for (const testCase of cases) {
    for (let repetition = 1; repetition <= repetitions; repetition += 1) {
      const startedAt = new Date();
      const started = performance.now();
      let observed;
      let adapterError;
      try {
        observed = validateAdapterResult(await invoke({
          protocol_version: 1,
          run_id: runId,
          case: testCase,
          repetition,
          candidate_catalog: suite.units,
          metadata,
        }), candidateNames);
      } catch (error) {
        adapterError = error;
        observed = adapterFailure(error);
      }
      const durationMs = performance.now() - started;
      const score = adapterError
        ? { passed: false, reason: "adapter execution failed" }
        : scoreRoutingResult(testCase, observed);

      records.push({
        record_type: "case",
        schema_version: 1,
        run_id: runId,
        case_id: testCase.id,
        case_type: testCase.case_type,
        unit_kind: testCase.kind,
        target: testCase.target,
        repetition,
        prompt: testCase.prompt,
        expectation: testCase.expectation,
        observed,
        passed: score.passed,
        ...(score.reason ? { failure_reason: score.reason } : {}),
        metadata,
        started_at: startedAt.toISOString(),
        completed_at: new Date().toISOString(),
        wall_time_ms: Math.round(durationMs * 1000) / 1000,
      });
    }
  }
  return { runId, records };
}

export function summarizeResults(records, runId) {
  const passed = records.filter((record) => record.passed).length;
  const failed = records.length - passed;
  const adapterErrors = records.filter((record) => record.observed.outcome === "error").length;
  const knownUsage = records.filter((record) => record.observed.usage.total_tokens !== null);
  const knownLatency = records.filter((record) => record.observed.model_latency_ms !== null);
  const toolCalls = records.flatMap((record) => record.observed.tool_calls);
  const knownToolLatency = toolCalls.filter((call) => call.latency_ms !== null);
  const milliseconds = (values) => Math.round(values.reduce((sum, value) => sum + value, 0) * 1000) / 1000;

  return {
    record_type: "summary",
    schema_version: 1,
    run_id: runId,
    cases: records.length,
    passed,
    failed,
    pass_rate: records.length === 0 ? 0 : passed / records.length,
    adapter_errors: adapterErrors,
    tokens: {
      total: knownUsage.reduce((sum, record) => sum + record.observed.usage.total_tokens, 0),
      recorded_runs: knownUsage.length,
      unavailable_runs: records.length - knownUsage.length,
    },
    latency_ms: {
      wall_total: milliseconds(records.map((record) => record.wall_time_ms)),
      model_total: milliseconds(knownLatency.map((record) => record.observed.model_latency_ms)),
      model_recorded_runs: knownLatency.length,
      model_unavailable_runs: records.length - knownLatency.length,
    },
    tool_calls: {
      total: toolCalls.length,
      latency_total: milliseconds(knownToolLatency.map((call) => call.latency_ms)),
      latency_recorded_calls: knownToolLatency.length,
      latency_unavailable_calls: toolCalls.length - knownToolLatency.length,
    },
  };
}
