import assert from "node:assert/strict";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { createProcessAdapter } from "../src/routing/process-adapter.mjs";
import { loadToolCallSuite } from "../src/tool-calls/corpus.mjs";
import {
  runEvaluation,
  scoreToolCallResult,
  summarizeResults,
  validateAdapterResult,
} from "../src/tool-calls/evaluator.mjs";

const testRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(testRoot, "..");

test("loads the versioned tool-call corpus and every MCP profile", async () => {
  const suite = await loadToolCallSuite({ root: repositoryRoot });
  assert.equal(suite.cases.length, 19);
  assert.deepEqual(Object.keys(suite.profiles).sort(), ["consumer", "merchant", "publication"]);
  assert.equal(suite.tools.length, 84);
  assert.equal(suite.cases.some((testCase) => testCase.category === "confirmation"), true);
  assert.equal(suite.cases.some((testCase) => testCase.category === "recovery"), true);
});

test("scores exact arguments, forbidden tools, and outcome boundaries", () => {
  const testCase = {
    expectation: {
      outcome: "awaiting_confirmation",
      match: "exact",
      calls: [{
        name: "pay_order",
        arguments: { order_id: "order_test_001", operation_key: "op_test_001" },
        argument_match: "exact",
        tool_outcome: "confirmation_required",
      }],
      forbidden_tools: ["create_refund"],
      max_calls: 1,
    },
  };
  const passing = {
    outcome: "awaiting_confirmation",
    tool_calls: [{
      name: "pay_order",
      arguments: { order_id: "order_test_001", operation_key: "op_test_001" },
      outcome: "confirmation_required",
    }],
  };
  assert.equal(scoreToolCallResult(testCase, passing).passed, true);
  assert.match(scoreToolCallResult(testCase, {
    ...passing,
    tool_calls: [{ name: "create_refund", arguments: {}, outcome: "success" }],
  }).reason, /forbidden tools/);
  assert.match(scoreToolCallResult(testCase, {
    ...passing,
    tool_calls: [{ ...passing.tool_calls[0], arguments: { order_id: "order_test_002", operation_key: "op_test_001" } }],
  }).reason, /arguments did not exact match/);
  assert.match(scoreToolCallResult(testCase, passing, new Set(["get_order"])).reason, /outside profile/);
});

test("supports ordered subsequences with subset argument matching", () => {
  const testCase = {
    expectation: {
      outcome: "completed",
      match: "ordered_subsequence",
      calls: [
        { name: "get_order", arguments: { order_id: "order_test_001" }, argument_match: "subset", tool_outcome: "success" },
        { name: "get_refund_options", arguments: { order_id: "order_test_001" }, argument_match: "exact", tool_outcome: "success" },
      ],
      forbidden_tools: [],
      max_calls: 3,
    },
  };
  const result = {
    outcome: "completed",
    tool_calls: [
      { name: "get_order", arguments: { order_id: "order_test_001", expand: true }, outcome: "success" },
      { name: "get_customer", arguments: { customer_id: "cust_test_001" }, outcome: "success" },
      { name: "get_refund_options", arguments: { order_id: "order_test_001" }, outcome: "success" },
    ],
  };
  assert.equal(scoreToolCallResult(testCase, result).passed, true);
});

test("executes the tool adapter and summarizes profile evidence", async () => {
  const suite = await loadToolCallSuite({ root: repositoryRoot });
  const cases = [
    suite.cases.find((testCase) => testCase.profile === "merchant"),
    suite.cases.find((testCase) => testCase.profile === "publication"),
    suite.cases.find((testCase) => testCase.profile === "consumer"),
  ];
  const fixture = join(testRoot, "fixtures", "passing-tool-call-adapter.mjs");
  const { records } = await runEvaluation({
    suite,
    cases,
    invoke: createProcessAdapter({ command: process.execPath, args: [fixture], timeoutMs: 5_000 }),
    metadata: {
      provider: "fixture",
      model: "fixture",
      host: "node-test",
      host_version: process.version,
      plugin_revision: "test",
      locale: "en-US",
      execution_region: "local",
    },
    runId: "fixture-tool-run",
  });

  assert.equal(records.length, 3);
  assert.equal(records.every((record) => record.passed), true);
  const summary = summarizeResults(records, "fixture-tool-run");
  assert.equal(summary.pass_rate, 1);
  assert.equal(summary.tokens.total, 225);
  assert.equal(summary.by_profile.consumer.pass_rate, 1);
  assert.equal(summary.by_profile.merchant.pass_rate, 1);
  assert.equal(summary.by_profile.publication.pass_rate, 1);
});

test("rejects unknown tools and fabricated usage evidence", () => {
  const base = {
    protocol_version: 1,
    outcome: "completed",
    usage: {
      source: "provider",
      input_tokens: 10,
      output_tokens: 5,
      total_tokens: 15,
    },
    model_latency_ms: 20,
    semantic_outcome: "success",
    tool_calls: [],
  };
  assert.throws(
    () => validateAdapterResult({
      ...base,
      tool_calls: [{ name: "unknown", arguments: {}, latency_ms: null, outcome: "success" }],
    }, new Set(["get_order"])),
    /unknown tool/,
  );
  assert.throws(
    () => validateAdapterResult({
      ...base,
      usage: { source: "unavailable", input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    }, new Set(["get_order"])),
    /unavailable usage must use null/,
  );
  assert.throws(
    () => validateAdapterResult({ ...base, reasoning: "hidden reasoning must not be recorded" }, new Set(["get_order"])),
    /unsupported fields/,
  );
});
