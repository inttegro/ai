import { randomUUID } from "node:crypto";


const outcomes = new Set(["completed", "clarified", "refused", "awaiting_confirmation", "error"]);
const usageSources = new Set(["provider", "host", "unavailable"]);
const semanticOutcomes = new Set(["success", "partial", "failure", "not_applicable"]);
const toolOutcomes = new Set(["success", "error", "cancelled", "confirmation_required", "unknown"]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nullableCount(value, field) {
  assert(value === null || (Number.isInteger(value) && value >= 0), `${field} must be a non-negative integer or null`);
}

function nullableDuration(value, field) {
  assert(value === null || (Number.isFinite(value) && value >= 0), `${field} must be a non-negative number or null`);
}

function jsonValue(value, field) {
  if (value === null || ["string", "boolean"].includes(typeof value)) return;
  if (typeof value === "number") {
    assert(Number.isFinite(value), `${field} must contain finite numbers`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => jsonValue(entry, `${field}[${index}]`));
    return;
  }
  assert(isRecord(value), `${field} must be JSON-compatible`);
  for (const [key, entry] of Object.entries(value)) jsonValue(entry, `${field}.${key}`);
}

function validateUsage(usage) {
  assert(isRecord(usage), "adapter must report usage provenance");
  assert(usageSources.has(usage.source), `adapter returned unknown usage source ${usage.source}`);
  nullableCount(usage.input_tokens, "usage.input_tokens");
  nullableCount(usage.output_tokens, "usage.output_tokens");
  nullableCount(usage.total_tokens, "usage.total_tokens");
  if (usage.source === "unavailable") {
    assert(
      usage.input_tokens === null && usage.output_tokens === null && usage.total_tokens === null,
      "unavailable usage must use null token counts",
    );
  }
  if (usage.input_tokens !== null && usage.output_tokens !== null && usage.total_tokens !== null) {
    assert(
      usage.input_tokens + usage.output_tokens === usage.total_tokens,
      "usage.total_tokens must equal input_tokens plus output_tokens",
    );
  }
}

export function validateAdapterResult(value, knownTools) {
  assert(isRecord(value), "adapter must return a JSON object");
  const allowedResultKeys = new Set([
    "protocol_version",
    "outcome",
    "usage",
    "model_latency_ms",
    "semantic_outcome",
    "tool_calls",
    "trace_id",
    "error_kind",
  ]);
  const extraResultKeys = Object.keys(value).filter((key) => !allowedResultKeys.has(key));
  assert(extraResultKeys.length === 0, `adapter result has unsupported fields: ${extraResultKeys.join(", ")}`);
  assert(value.protocol_version === 1, "adapter result must use protocol_version 1");
  assert(outcomes.has(value.outcome), `adapter returned unknown outcome ${value.outcome}`);
  validateUsage(value.usage);
  nullableDuration(value.model_latency_ms, "model_latency_ms");
  assert(semanticOutcomes.has(value.semantic_outcome), `unknown semantic_outcome ${value.semantic_outcome}`);
  assert(Array.isArray(value.tool_calls), "adapter tool_calls must be an array");
  for (const [index, call] of value.tool_calls.entries()) {
    assert(isRecord(call), `tool_calls[${index}] must be an object`);
    const allowedCallKeys = new Set(["name", "arguments", "latency_ms", "outcome"]);
    const extraCallKeys = Object.keys(call).filter((key) => !allowedCallKeys.has(key));
    assert(extraCallKeys.length === 0, `tool_calls[${index}] has unsupported fields: ${extraCallKeys.join(", ")}`);
    assert(typeof call.name === "string" && call.name.length > 0, `tool_calls[${index}].name is required`);
    assert(knownTools.has(call.name), `tool_calls[${index}] uses unknown tool ${call.name}`);
    assert(isRecord(call.arguments), `tool_calls[${index}].arguments must be an object`);
    jsonValue(call.arguments, `tool_calls[${index}].arguments`);
    nullableDuration(call.latency_ms, `tool_calls[${index}].latency_ms`);
    assert(toolOutcomes.has(call.outcome), `tool_calls[${index}] has unknown outcome ${call.outcome}`);
  }
  if (value.trace_id !== undefined) {
    assert(typeof value.trace_id === "string" && value.trace_id.length > 0, "trace_id must be a non-empty string");
  }
  if (value.error_kind !== undefined) {
    assert(typeof value.error_kind === "string" && value.error_kind.length > 0, "error_kind must be a non-empty string");
  }
  return value;
}

function deepEqual(expected, actual) {
  if (Object.is(expected, actual)) return true;
  if (Array.isArray(expected)) {
    return Array.isArray(actual) && expected.length === actual.length && expected.every((value, index) => deepEqual(value, actual[index]));
  }
  if (isRecord(expected)) {
    if (!isRecord(actual)) return false;
    const expectedKeys = Object.keys(expected);
    const actualKeys = Object.keys(actual);
    return expectedKeys.length === actualKeys.length && expectedKeys.every((key) => (
      Object.hasOwn(actual, key) && deepEqual(expected[key], actual[key])
    ));
  }
  return false;
}

function isSubset(expected, actual) {
  if (Object.is(expected, actual)) return true;
  if (Array.isArray(expected)) {
    return Array.isArray(actual) && expected.length === actual.length && expected.every((value, index) => isSubset(value, actual[index]));
  }
  if (isRecord(expected)) {
    return isRecord(actual) && Object.entries(expected).every(([key, value]) => (
      Object.hasOwn(actual, key) && isSubset(value, actual[key])
    ));
  }
  return false;
}

function callMatches(expected, actual) {
  if (expected.name !== actual.name || expected.tool_outcome !== actual.outcome) return false;
  return expected.argument_match === "exact"
    ? deepEqual(expected.arguments, actual.arguments)
    : isSubset(expected.arguments, actual.arguments);
}

function callMismatch(expected, actual, position) {
  if (!actual) return `missing expected call ${position + 1}: ${expected.name}`;
  if (expected.name !== actual.name) return `call ${position + 1} expected ${expected.name}, observed ${actual.name}`;
  if (expected.tool_outcome !== actual.outcome) {
    return `call ${position + 1} ${expected.name} expected outcome ${expected.tool_outcome}, observed ${actual.outcome}`;
  }
  return `call ${position + 1} ${expected.name} arguments did not ${expected.argument_match} match`;
}

export function scoreToolCallResult(testCase, result, candidateTools) {
  const failures = [];
  const expected = testCase.expectation;
  if (result.outcome !== expected.outcome) failures.push(`expected outcome ${expected.outcome}, observed ${result.outcome}`);
  if (result.tool_calls.length > expected.max_calls) {
    failures.push(`expected at most ${expected.max_calls} calls, observed ${result.tool_calls.length}`);
  }
  const forbidden = result.tool_calls.map((call) => call.name).filter((name) => expected.forbidden_tools.includes(name));
  if (forbidden.length > 0) failures.push(`called forbidden tools: ${[...new Set(forbidden)].join(", ")}`);
  if (candidateTools) {
    const unavailable = result.tool_calls.map((call) => call.name).filter((name) => !candidateTools.has(name));
    if (unavailable.length > 0) failures.push(`called tools outside profile: ${[...new Set(unavailable)].join(", ")}`);
  }

  if (expected.match === "none" && result.tool_calls.length > 0) {
    failures.push(`expected no tool calls, observed ${result.tool_calls.map((call) => call.name).join(", ")}`);
  } else if (expected.match === "exact") {
    if (result.tool_calls.length !== expected.calls.length) {
      failures.push(`expected exactly ${expected.calls.length} calls, observed ${result.tool_calls.length}`);
    }
    for (let index = 0; index < expected.calls.length; index += 1) {
      if (!callMatches(expected.calls[index], result.tool_calls[index])) {
        failures.push(callMismatch(expected.calls[index], result.tool_calls[index], index));
      }
    }
  } else if (expected.match === "ordered_subsequence") {
    let actualIndex = 0;
    for (const expectedCall of expected.calls) {
      while (actualIndex < result.tool_calls.length && !callMatches(expectedCall, result.tool_calls[actualIndex])) actualIndex += 1;
      if (actualIndex === result.tool_calls.length) {
        failures.push(`did not observe expected ordered call ${expectedCall.name}`);
        break;
      }
      actualIndex += 1;
    }
  }

  return failures.length === 0
    ? { passed: true }
    : { passed: false, reason: failures.join("; ") };
}

function adapterFailure(error) {
  return {
    protocol_version: 1,
    outcome: "error",
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
  const knownTools = new Set(suite.tools);
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
          candidate_tools: suite.profiles[testCase.profile],
          metadata,
        }), knownTools);
      } catch (error) {
        adapterError = error;
        observed = adapterFailure(error);
      }
      const durationMs = performance.now() - started;
      const score = adapterError
        ? { passed: false, reason: "adapter execution failed" }
        : scoreToolCallResult(testCase, observed, new Set(suite.profiles[testCase.profile]));

      records.push({
        record_type: "case",
        schema_version: 1,
        run_id: runId,
        case_id: testCase.id,
        profile: testCase.profile,
        category: testCase.category,
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
  const adapterErrors = records.filter((record) => record.observed.outcome === "error").length;
  const knownUsage = records.filter((record) => record.observed.usage.total_tokens !== null);
  const knownLatency = records.filter((record) => record.observed.model_latency_ms !== null);
  const toolCalls = records.flatMap((record) => record.observed.tool_calls);
  const knownToolLatency = toolCalls.filter((call) => call.latency_ms !== null);
  const milliseconds = (values) => Math.round(values.reduce((sum, value) => sum + value, 0) * 1000) / 1000;
  const dimensions = (field) => Object.fromEntries([...new Set(records.map((record) => record[field]))].sort().map((name) => {
    const selected = records.filter((record) => record[field] === name);
    const selectedPassed = selected.filter((record) => record.passed).length;
    return [name, { cases: selected.length, passed: selectedPassed, pass_rate: selectedPassed / selected.length }];
  }));

  return {
    record_type: "summary",
    schema_version: 1,
    run_id: runId,
    cases: records.length,
    passed,
    failed: records.length - passed,
    pass_rate: records.length === 0 ? 0 : passed / records.length,
    adapter_errors: adapterErrors,
    by_profile: dimensions("profile"),
    by_category: dimensions("category"),
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
