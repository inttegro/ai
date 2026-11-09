#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = join(root, "contracts", "inttegro-mcp-tools.json");
const contract = JSON.parse(await readFile(contractPath, "utf8"));
const profileNames = ["merchant", "publication", "consumer"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function markdownFiles(path) {
  const value = await stat(path).catch(() => null);
  if (!value) return [];
  if (value.isFile()) return path.endsWith(".md") ? [path] : [];
  const files = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) files.push(...(await markdownFiles(child)));
    if (entry.isFile() && entry.name.endsWith(".md")) files.push(child);
  }
  return files.sort();
}

function setDifference(left, right) {
  return [...left].filter((value) => !right.has(value)).sort();
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

assert(contract.schema_version === 1, "tool contract must use schema_version 1");
assert(
  JSON.stringify(Object.keys(contract.profiles).sort()) === JSON.stringify([...profileNames].sort()),
  `tool contract must define exactly ${profileNames.join(", ")}`,
);

const toolsByProfile = new Map();
for (const profile of profileNames) {
  const tools = contract.profiles[profile]?.tools;
  assert(Array.isArray(tools) && tools.length > 0, `${profile} profile must contain tools`);
  assert(
    tools.every((tool) => typeof tool === "string" && /^[a-z][a-z0-9_]*$/.test(tool)),
    `${profile} profile contains an invalid tool name`,
  );
  const duplicates = duplicateValues(tools);
  assert(!duplicates.length, `${profile} profile repeats: ${duplicates.join(", ")}`);
  toolsByProfile.set(profile, new Set(tools));
}

const merchantTools = toolsByProfile.get("merchant");
const publicationTools = toolsByProfile.get("publication");
assert(
  setDifference(publicationTools, merchantTools).length === 0,
  "publication tools must be a subset of merchant tools",
);

const productRoot = join(root, "products", "shop-with-inttegro");
const product = JSON.parse(await readFile(join(productRoot, "product.json"), "utf8"));
assert(product.status === "activation-gated", "consumer product must remain activation-gated");
assert(product.mcp_profile === "consumer", "consumer product must select the consumer profile");
assert(
  JSON.stringify([...product.required_tools].sort()) ===
    JSON.stringify([...toolsByProfile.get("consumer")].sort()),
  "consumer product required_tools must match the consumer MCP profile",
);
assert(
  Array.isArray(product.activation_gates) && product.activation_gates.length >= 5,
  "consumer product must preserve its release gates",
);

const sources = {
  merchant: [
    join(root, "plugins", "inttegro", "skills"),
    join(root, "plugins", "inttegro", "agents"),
  ],
  publication: [
    join(root, "plugins", "inttegro", "skills"),
    join(root, "plugins", "inttegro", "agents"),
  ],
  consumer: product.workflow_roots.map((path) => join(productRoot, path)),
};

for (const profile of profileNames) {
  const files = (await Promise.all(sources[profile].map(markdownFiles))).flat();
  assert(files.length > 0, `${profile} profile has no workflow Markdown`);
  const combined = (await Promise.all(files.map((path) => readFile(path, "utf8")))).join("\n");
  const missing = [...toolsByProfile.get(profile)].filter(
    (tool) => !new RegExp(`(?<![a-z0-9_])${tool}(?![a-z0-9_])`).test(combined),
  );
  assert(
    !missing.length,
    `${profile} tools have no skill or agent coverage: ${missing.sort().join(", ")}`,
  );

  if (profile === "consumer") {
    const allTools = new Set([...merchantTools, ...toolsByProfile.get("consumer")]);
    const outOfProfile = [...allTools].filter(
      (tool) => !toolsByProfile.get(profile).has(tool) &&
        new RegExp(`(?<![a-z0-9_])${tool}(?![a-z0-9_])`).test(combined),
    );
    assert(
      !outOfProfile.length,
      `consumer workflow references merchant tools: ${outOfProfile.sort().join(", ")}`,
    );
  }

  console.log(
    `${profile}: ${toolsByProfile.get(profile).size} tools covered by ${files.length} workflow files`,
  );
}

const liveReportFlag = process.argv.indexOf("--live-report");
if (liveReportFlag !== -1) {
  const reportPath = process.argv[liveReportFlag + 1];
  assert(reportPath, "--live-report requires a path to mcp-doctor JSON output");
  const profileFlag = process.argv.indexOf("--profile");
  const profile = profileFlag === -1 ? "merchant" : process.argv[profileFlag + 1];
  assert(profileNames.includes(profile), `--profile must be one of ${profileNames.join(", ")}`);
  const report = JSON.parse(await readFile(resolve(reportPath), "utf8"));
  assert(Array.isArray(report.catalog?.tools), "live report does not contain catalog.tools");
  const actual = new Set(report.catalog.tools);
  const expected = toolsByProfile.get(profile);
  const missing = setDifference(expected, actual);
  const unexpected = setDifference(actual, expected);
  assert(
    !missing.length && !unexpected.length,
    `live ${profile} catalog drifted; missing: ${missing.join(", ") || "none"}; unexpected: ${unexpected.join(", ") || "none"}`,
  );
  console.log(`live ${profile}: ${actual.size} tools match the committed contract`);
}

const runtimeSourceFlag = process.argv.indexOf("--runtime-source");
if (runtimeSourceFlag !== -1) {
  const sourcePath = process.argv[runtimeSourceFlag + 1];
  assert(sourcePath, "--runtime-source requires a path to mcp/src/tools/catalog.ts");
  const source = await readFile(resolve(sourcePath), "utf8");
  const patterns = {
    merchant: /export const COMMERCE_TOOL_SCOPE = \{([\s\S]*?)\n\} as const;/,
    publication: /export const PUBLICATION_COMMERCE_TOOL_NAMES = Object\.freeze\(\[([\s\S]*?)\]\s+satisfies/,
    consumer: /export const MUSE_CONSUMER_TOOL_NAMES = Object\.freeze\(\[([\s\S]*?)\]\s+as const\);/,
  };

  for (const profile of profileNames) {
    const body = source.match(patterns[profile])?.[1];
    assert(body, `runtime source does not expose the ${profile} tool catalog`);
    const names = profile === "merchant"
      ? [...body.matchAll(/^\s{2}([a-z0-9_]+):/gm)].map((match) => match[1])
      : [...body.matchAll(/"([a-z0-9_]+)"/g)].map((match) => match[1]);
    const actual = new Set(names);
    const expected = toolsByProfile.get(profile);
    const missing = setDifference(expected, actual);
    const unexpected = setDifference(actual, expected);
    assert(
      !missing.length && !unexpected.length,
      `runtime ${profile} catalog drifted; missing: ${missing.join(", ") || "none"}; unexpected: ${unexpected.join(", ") || "none"}`,
    );
    console.log(`runtime ${profile}: ${actual.size} tools match the committed contract`);
  }
}

console.log(`Validated ${new Set([...merchantTools, ...toolsByProfile.get("consumer")]).size} unique MCP tools.`);
