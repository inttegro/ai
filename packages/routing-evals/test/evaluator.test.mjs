import assert from "node:assert/strict";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { loadRoutingSuite } from "../src/corpus.mjs";
import {
  runEvaluation,
  scoreRoutingResult,
  summarizeResults,
  validateAdapterResult,
} from "../src/evaluator.mjs";
import { createProcessAdapter } from "../src/process-adapter.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "..", "..");

test("loads every committed skill, agent, and routing case", async () => {
  const suite = await loadRoutingSuite({ root: repositoryRoot });
  assert.equal(suite.units.length, 31);
  assert.equal(suite.cases.length, 105);
  assert.equal(suite.units.find((unit) => unit.name === "shop").kind, "skill");
  assert.equal(suite.units.find((unit) => unit.name === "revenue-recovery-manager").kind, "agent");
});

test("scores include, exclude, clarify, and exact expectations", () => {
  const result = (outcome, selected_units) => ({ outcome, selected_units });
  const testCase = (mode, units) => ({ expectation: { mode, units } });

  assert.equal(scoreRoutingResult(testCase("include", ["checkout"]), result("selected", ["checkout"])).passed, true);
  assert.equal(scoreRoutingResult(testCase("exclude", ["checkout"]), result("selected", ["debug"])).passed, true);
  assert.equal(scoreRoutingResult(testCase("include_or_clarify", ["checkout"]), result("clarified", [])).passed, true);
  assert.equal(scoreRoutingResult(testCase("exact", ["checkout", "testing"]), result("selected", ["checkout", "testing"])).passed, true);
  assert.equal(scoreRoutingResult(testCase("exact", ["checkout"]), result("selected", ["checkout", "testing"])).passed, false);
});

test("executes a host adapter and summarizes provenance", async () => {
  const suite = await loadRoutingSuite({ root: repositoryRoot });
  const wanted = new Set(["positive", "negative", "ambiguous", "overlap"]);
  const cases = [];
  for (const testCase of suite.cases) {
    if (wanted.delete(testCase.case_type)) cases.push(testCase);
    if (wanted.size === 0) break;
  }
  const fixture = join(packageRoot, "fixtures", "passing-adapter.mjs");
  const { runId, records } = await runEvaluation({
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
    runId: "fixture-run",
  });

  assert.equal(runId, "fixture-run");
  assert.equal(records.length, 4);
  assert.equal(records.every((record) => record.passed), true);
  const summary = summarizeResults(records, runId);
  assert.equal(summary.pass_rate, 1);
  assert.equal(summary.tokens.total, 200);
  assert.equal(summary.tokens.unavailable_runs, 0);
  assert.equal(summary.tool_calls.total, 0);
});

test("records unavailable evidence instead of fabricating measurements", async () => {
  const suite = await loadRoutingSuite({ root: repositoryRoot });
  const { records } = await runEvaluation({
    suite,
    cases: [suite.cases[0]],
    invoke: async () => {
      throw Object.assign(new Error("fixture failure"), { name: "FixtureError" });
    },
    metadata: {},
    runId: "failed-run",
  });

  assert.equal(records[0].passed, false);
  assert.equal(records[0].observed.outcome, "error");
  assert.equal(records[0].observed.usage.source, "unavailable");
  assert.equal(records[0].observed.usage.total_tokens, null);
  assert.equal(records[0].observed.error_kind, "FixtureError");
});

test("rejects fabricated or unknown adapter evidence", () => {
  const base = {
    protocol_version: 1,
    outcome: "selected",
    selected_units: ["checkout"],
    usage: {
      source: "provider",
      input_tokens: 10,
      output_tokens: 5,
      total_tokens: 15,
    },
    model_latency_ms: 20,
    semantic_outcome: "not_applicable",
    tool_calls: [],
  };
  assert.throws(
    () => validateAdapterResult({ ...base, selected_units: ["unknown"] }, new Set(["checkout"])),
    /unknown units/,
  );
  assert.throws(
    () => validateAdapterResult({
      ...base,
      usage: { source: "unavailable", input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    }, new Set(["checkout"])),
    /unavailable usage must use null/,
  );
});
