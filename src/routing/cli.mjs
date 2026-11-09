import { randomUUID } from "node:crypto";
import { chmod, lstat, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadRoutingSuite } from "./corpus.mjs";
import { runEvaluation, summarizeResults } from "./evaluator.mjs";
import { createProcessAdapter } from "./process-adapter.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const help = `Inttegro routing evaluations

Usage:
  inttegro-ai eval routing --adapter COMMAND --provider NAME --model NAME \\
    --host NAME --host-version VERSION --plugin-revision SHA \\
    --execution-region REGION [options]

Required options:
  --adapter COMMAND          Executable adapter that reads one JSON request on stdin
  --provider NAME            Model provider recorded in every result
  --model NAME               Model identifier recorded in every result
  --host NAME                Agent host or harness name
  --host-version VERSION     Agent host or harness version
  --plugin-revision SHA      Evaluated Inttegro plugin revision
  --execution-region REGION  Provider or runner execution region, or "not_recorded"

Options:
  --adapter-arg VALUE        Pass one argument to the adapter; repeat as needed
  --root PATH                Alternate Inttegro AI source root (default: installed package)
  --corpus PATH              Routing corpus (default: <root>/evals/routing.json)
  --output PATH              Write JSONL to a file instead of stdout
  --locale LOCALE            Evaluation locale (default: runtime locale)
  --repetitions N            Runs per case, 1-20 (default: 1)
  --timeout MS               Per-case adapter timeout, 100-300000 (default: 120000)
  --kind KIND                Include skill, agent, or overlap cases; repeat as needed
  --case-type TYPE           Include positive, negative, ambiguous, or overlap cases
  --unit NAME                Include cases targeting or expecting this unit
  --limit N                  Run only the first N filtered cases
  --minimum-score RATE       Exit nonzero below this 0-1 pass rate (default: 1)
  --run-id ID                Supply a run identifier (default: generated UUID)
  --help                     Show this help

The adapter protocol and result provenance requirements are documented in
docs/routing-evaluations.md. Adapter stderr is never copied into result artifacts.`;

function requiredValue(args, index, option, { allowOption = false } = {}) {
  const value = args[index + 1];
  if (!value || (!allowOption && value.startsWith("--"))) throw new Error(`${option} requires a value`);
  return value;
}

function integer(value, option, minimum, maximum) {
  const result = Number(value);
  if (!Number.isInteger(result) || result < minimum || result > maximum) {
    throw new Error(`${option} must be an integer between ${minimum} and ${maximum}`);
  }
  return result;
}

function parseArgs(args) {
  const options = {
    adapterArgs: [],
    kinds: [],
    caseTypes: [],
    units: [],
    repetitions: 1,
    timeoutMs: 120_000,
    minimumScore: 1,
    locale: Intl.DateTimeFormat().resolvedOptions().locale || "und",
    root: packageRoot,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help") return { help: true };
    const valueOptions = new Map([
      ["--adapter", "adapter"],
      ["--provider", "provider"],
      ["--model", "model"],
      ["--host", "host"],
      ["--host-version", "hostVersion"],
      ["--plugin-revision", "pluginRevision"],
      ["--execution-region", "executionRegion"],
      ["--root", "root"],
      ["--corpus", "corpusPath"],
      ["--output", "output"],
      ["--locale", "locale"],
      ["--run-id", "runId"],
    ]);
    if (valueOptions.has(argument)) {
      options[valueOptions.get(argument)] = requiredValue(args, index, argument);
      index += 1;
      continue;
    }
    if (argument === "--adapter-arg") {
      options.adapterArgs.push(requiredValue(args, index, argument, { allowOption: true }));
      index += 1;
      continue;
    }
    if (argument === "--kind") {
      const value = requiredValue(args, index, argument);
      if (!new Set(["skill", "agent", "overlap"]).has(value)) throw new Error(`unknown kind ${value}`);
      options.kinds.push(value);
      index += 1;
      continue;
    }
    if (argument === "--case-type") {
      const value = requiredValue(args, index, argument);
      if (!new Set(["positive", "negative", "ambiguous", "overlap"]).has(value)) {
        throw new Error(`unknown case type ${value}`);
      }
      options.caseTypes.push(value);
      index += 1;
      continue;
    }
    if (argument === "--unit") {
      options.units.push(requiredValue(args, index, argument));
      index += 1;
      continue;
    }
    if (argument === "--repetitions") {
      options.repetitions = integer(requiredValue(args, index, argument), argument, 1, 20);
      index += 1;
      continue;
    }
    if (argument === "--timeout") {
      options.timeoutMs = integer(requiredValue(args, index, argument), argument, 100, 300_000);
      index += 1;
      continue;
    }
    if (argument === "--limit") {
      options.limit = integer(requiredValue(args, index, argument), argument, 1, 100_000);
      index += 1;
      continue;
    }
    if (argument === "--minimum-score") {
      options.minimumScore = Number(requiredValue(args, index, argument));
      if (!Number.isFinite(options.minimumScore) || options.minimumScore < 0 || options.minimumScore > 1) {
        throw new Error("--minimum-score must be between 0 and 1");
      }
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function requireMetadata(options) {
  for (const field of ["adapter", "provider", "model", "host", "hostVersion", "pluginRevision", "executionRegion"]) {
    if (!options[field]) throw new Error(`--${field.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)} is required`);
  }
}

function selectCases(cases, options) {
  const kinds = new Set(options.kinds);
  const caseTypes = new Set(options.caseTypes);
  const units = new Set(options.units);
  const selected = cases.filter((testCase) => {
    if (kinds.size && !kinds.has(testCase.kind)) return false;
    if (caseTypes.size && !caseTypes.has(testCase.case_type)) return false;
    if (units.size) {
      const names = new Set([testCase.target, ...testCase.expectation.units].filter(Boolean));
      if (![...units].some((name) => names.has(name))) return false;
    }
    return true;
  });
  return options.limit ? selected.slice(0, options.limit) : selected;
}

export async function main(args) {
  const options = parseArgs(args);
  if (options.help) {
    console.log(help);
    return;
  }
  requireMetadata(options);

  const root = resolve(options.root);
  const suite = await loadRoutingSuite({
    root,
    corpusPath: options.corpusPath ? resolve(options.corpusPath) : resolve(root, "evals", "routing.json"),
  });
  const cases = selectCases(suite.cases, options);
  if (cases.length === 0) throw new Error("No routing cases matched the selected filters");

  const metadata = {
    provider: options.provider,
    model: options.model,
    host: options.host,
    host_version: options.hostVersion,
    plugin_revision: options.pluginRevision,
    locale: options.locale,
    execution_region: options.executionRegion,
  };
  const runId = options.runId || randomUUID();
  const { records } = await runEvaluation({
    suite,
    cases,
    invoke: createProcessAdapter({
      command: options.adapter,
      args: options.adapterArgs,
      timeoutMs: options.timeoutMs,
    }),
    metadata,
    repetitions: options.repetitions,
    runId,
  });
  const summary = summarizeResults(records, runId);
  const preamble = {
    record_type: "run",
    schema_version: 1,
    run_id: runId,
    corpus: suite.corpus,
    unit_count: suite.units.length,
    case_count: cases.length,
    repetitions: options.repetitions,
    metadata,
  };
  const jsonl = [preamble, ...records, summary].map((record) => JSON.stringify(record)).join("\n") + "\n";

  if (options.output) {
    const output = resolve(options.output);
    await mkdir(dirname(output), { recursive: true });
    const existing = await lstat(output).catch(() => null);
    if (existing?.isSymbolicLink()) throw new Error("refusing to write an evaluation artifact through a symbolic link");
    await writeFile(output, jsonl, { encoding: "utf8", mode: 0o600 });
    await chmod(output, 0o600);
    console.error(`Wrote ${records.length} routing results to ${output}`);
  } else {
    process.stdout.write(jsonl);
  }
  console.error(`${summary.passed}/${summary.cases} passed (${(summary.pass_rate * 100).toFixed(1)}%)`);
  if (summary.pass_rate < options.minimumScore || summary.adapter_errors > 0) process.exitCode = 1;
}
