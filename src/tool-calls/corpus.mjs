import { readFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";


const categories = new Set([
  "selection",
  "arguments",
  "sequence",
  "confirmation",
  "profile_boundary",
  "recovery",
]);
const outcomes = new Set(["completed", "clarified", "refused", "awaiting_confirmation"]);
const matchModes = new Set(["exact", "ordered_subsequence", "none"]);
const argumentModes = new Set(["exact", "subset"]);
const toolOutcomes = new Set(["success", "error", "cancelled", "confirmation_required", "unknown"]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function repositoryPath(root, path) {
  return relative(root, path).split(sep).join("/");
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateJsonValue(value, path) {
  if (value === null || ["string", "boolean"].includes(typeof value)) return;
  if (typeof value === "number") {
    assert(Number.isFinite(value), `${path} must contain finite numbers`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateJsonValue(item, `${path}[${index}]`));
    return;
  }
  assert(isRecord(value), `${path} must be JSON-compatible`);
  for (const [key, item] of Object.entries(value)) validateJsonValue(item, `${path}.${key}`);
}

function validateExpectedCall(call, path, profileTools) {
  assert(isRecord(call), `${path} must be an object`);
  assert(typeof call.name === "string" && call.name.length > 0, `${path}.name is required`);
  assert(profileTools.has(call.name), `${path} references ${call.name}, which is unavailable in this profile`);
  assert(isRecord(call.arguments), `${path}.arguments must be an object`);
  validateJsonValue(call.arguments, `${path}.arguments`);
  assert(argumentModes.has(call.argument_match), `${path}.argument_match must be exact or subset`);
  assert(toolOutcomes.has(call.tool_outcome), `${path}.tool_outcome is invalid`);
}

function validateFixture(fixture, path, profileTools) {
  assert(isRecord(fixture), `${path} must be an object`);
  assert(Array.isArray(fixture.tool_results), `${path}.tool_results must be an array`);
  fixture.tool_results.forEach((entry, index) => {
    const entryPath = `${path}.tool_results[${index}]`;
    assert(isRecord(entry), `${entryPath} must be an object`);
    assert(profileTools.has(entry.name), `${entryPath} references ${entry.name}, which is unavailable in this profile`);
    if (entry.outcome !== undefined) {
      assert(toolOutcomes.has(entry.outcome), `${entryPath}.outcome is invalid`);
    }
    assert(isRecord(entry.result), `${entryPath}.result must be an object`);
    validateJsonValue(entry.result, `${entryPath}.result`);
  });
}

function validateCase(testCase, index, profiles, knownTools) {
  const path = `tool-call case ${index + 1}`;
  assert(isRecord(testCase), `${path} must be an object`);
  assert(typeof testCase.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(testCase.id), `${path}.id must be lowercase kebab-case`);
  assert(profiles.has(testCase.profile), `${path} references unknown profile ${testCase.profile}`);
  assert(categories.has(testCase.category), `${path} has unknown category ${testCase.category}`);
  assert(typeof testCase.prompt === "string" && testCase.prompt.trim().length > 0, `${path}.prompt is required`);
  assert(typeof testCase.reason === "string" && testCase.reason.trim().length > 0, `${path}.reason is required`);

  const profileTools = profiles.get(testCase.profile);
  validateFixture(testCase.fixture, `${path}.fixture`, profileTools);
  assert(isRecord(testCase.expectation), `${path}.expectation must be an object`);
  const expectation = testCase.expectation;
  assert(outcomes.has(expectation.outcome), `${path}.expectation.outcome is invalid`);
  assert(matchModes.has(expectation.match), `${path}.expectation.match is invalid`);
  assert(Array.isArray(expectation.calls), `${path}.expectation.calls must be an array`);
  expectation.calls.forEach((call, callIndex) => validateExpectedCall(
    call,
    `${path}.expectation.calls[${callIndex}]`,
    profileTools,
  ));
  assert(Array.isArray(expectation.forbidden_tools), `${path}.expectation.forbidden_tools must be an array`);
  assert(
    new Set(expectation.forbidden_tools).size === expectation.forbidden_tools.length,
    `${path}.expectation.forbidden_tools must not contain duplicates`,
  );
  for (const tool of expectation.forbidden_tools) {
    assert(knownTools.has(tool), `${path}.expectation.forbidden_tools references unknown tool ${tool}`);
  }
  const expectedNames = new Set(expectation.calls.map((call) => call.name));
  const conflicts = expectation.forbidden_tools.filter((tool) => expectedNames.has(tool));
  assert(conflicts.length === 0, `${path} both expects and forbids: ${conflicts.join(", ")}`);
  assert(Number.isInteger(expectation.max_calls) && expectation.max_calls >= 0, `${path}.expectation.max_calls must be non-negative`);
  assert(expectation.calls.length <= expectation.max_calls, `${path} expects more calls than max_calls permits`);
  if (expectation.match === "none") assert(expectation.calls.length === 0, `${path} uses match none but expects calls`);
  if (expectation.match !== "none") assert(expectation.calls.length > 0, `${path} must expect at least one call`);

  let fixtureIndex = 0;
  for (const expectedCall of expectation.calls) {
    while (
      fixtureIndex < testCase.fixture.tool_results.length &&
      testCase.fixture.tool_results[fixtureIndex].name !== expectedCall.name
    ) fixtureIndex += 1;
    assert(fixtureIndex < testCase.fixture.tool_results.length, `${path}.fixture has no result for expected call ${expectedCall.name}`);
    const fixtureResult = testCase.fixture.tool_results[fixtureIndex];
    const fixtureOutcome = fixtureResult.outcome ?? "success";
    assert(
      fixtureOutcome === expectedCall.tool_outcome,
      `${path}.fixture outcome for ${expectedCall.name} is ${fixtureOutcome}, expected ${expectedCall.tool_outcome}`,
    );
    fixtureIndex += 1;
  }
}

export async function loadToolCallSuite({
  root = process.cwd(),
  corpusPath = resolve(root, "evals", "tool-calls.json"),
  contractPath = resolve(root, "contracts", "inttegro-mcp-tools.json"),
} = {}) {
  const repositoryRoot = resolve(root);
  const resolvedCorpus = resolve(corpusPath);
  const resolvedContract = resolve(contractPath);
  const [corpus, contract] = await Promise.all([
    readFile(resolvedCorpus, "utf8").then(JSON.parse),
    readFile(resolvedContract, "utf8").then(JSON.parse),
  ]);

  assert(corpus.schema_version === 1, "tool-call corpus must use schema_version 1");
  assert(Array.isArray(corpus.cases), "tool-call corpus must contain cases");
  assert(contract.schema_version === 1, "MCP tool contract must use schema_version 1");
  assert(isRecord(contract.profiles), "MCP tool contract must contain profiles");

  const profiles = new Map();
  for (const [profile, definition] of Object.entries(contract.profiles)) {
    assert(isRecord(definition) && Array.isArray(definition.tools), `profile ${profile} must contain tools`);
    assert(definition.tools.every((tool) => typeof tool === "string" && tool.length > 0), `profile ${profile} has an invalid tool name`);
    assert(new Set(definition.tools).size === definition.tools.length, `profile ${profile} contains duplicate tools`);
    profiles.set(profile, new Set(definition.tools));
  }
  const knownTools = new Set([...profiles.values()].flatMap((tools) => [...tools]));

  corpus.cases.forEach((testCase, index) => validateCase(testCase, index, profiles, knownTools));
  const ids = corpus.cases.map((testCase) => testCase.id);
  assert(new Set(ids).size === ids.length, "tool-call case ids must be unique");
  const prompts = corpus.cases.map((testCase) => testCase.prompt);
  assert(new Set(prompts).size === prompts.length, "tool-call prompts must be unique");
  const coveredProfiles = new Set(corpus.cases.map((testCase) => testCase.profile));
  const missingProfiles = [...profiles.keys()].filter((profile) => !coveredProfiles.has(profile));
  assert(missingProfiles.length === 0, `tool-call corpus has no cases for profiles: ${missingProfiles.join(", ")}`);
  const coveredCategories = new Set(corpus.cases.map((testCase) => testCase.category));
  const missingCategories = [...categories].filter((category) => !coveredCategories.has(category));
  assert(missingCategories.length === 0, `tool-call corpus has no cases for categories: ${missingCategories.join(", ")}`);

  return {
    schema_version: corpus.schema_version,
    corpus: repositoryPath(repositoryRoot, resolvedCorpus),
    contract: repositoryPath(repositoryRoot, resolvedContract),
    profiles: Object.fromEntries([...profiles].map(([name, tools]) => [name, [...tools]])),
    tools: [...knownTools].sort(),
    cases: corpus.cases,
  };
}
