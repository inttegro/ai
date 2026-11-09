#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corpus = JSON.parse(await readFile(join(root, "evals", "routing.json"), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function frontmatterName(source, path) {
  assert(source.startsWith("---\n"), `${path} must start with frontmatter`);
  const name = source.match(/^name:\s*([^\n]+)$/m)?.[1]?.trim();
  assert(name, `${path} has no frontmatter name`);
  return name;
}

async function skillNames() {
  const names = [];
  const rootPath = join(root, "plugins", "inttegro", "skills");
  for (const entry of await readdir(rootPath, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = join(rootPath, entry.name, "SKILL.md");
    names.push(frontmatterName(await readFile(path, "utf8"), path));
  }
  const consumerPath = join(
    root,
    "products",
    "shop-with-inttegro",
    "skills",
    "shop",
    "SKILL.md",
  );
  names.push(frontmatterName(await readFile(consumerPath, "utf8"), consumerPath));
  return names.sort();
}

async function agentNames() {
  const names = [];
  const rootPath = join(root, "plugins", "inttegro", "agents");
  for (const entry of await readdir(rootPath, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const path = join(rootPath, entry.name);
    names.push(frontmatterName(await readFile(path, "utf8"), path));
  }
  return names.sort();
}

function validateCases(kind, actualNames, entries) {
  assert(Array.isArray(entries), `routing corpus ${kind} must be an array`);
  const corpusNames = entries.map((entry) => entry.name).sort();
  assert(
    JSON.stringify(corpusNames) === JSON.stringify(actualNames),
    `${kind} routing coverage drifted; expected ${actualNames.join(", ")}; found ${corpusNames.join(", ")}`,
  );

  const prompts = new Map();
  for (const entry of entries) {
    for (const bucket of ["should_trigger", "should_not_trigger", "ambiguous"]) {
      const values = entry[bucket];
      assert(Array.isArray(values) && values.length > 0, `${kind} ${entry.name} needs ${bucket} cases`);
      for (const value of values) {
        assert(typeof value === "string" && value.trim().length >= 12, `${kind} ${entry.name} has a weak ${bucket} case`);
        const normalized = value.trim().toLowerCase();
        assert(!prompts.has(normalized), `routing prompt is duplicated by ${entry.name} and ${prompts.get(normalized)}`);
        prompts.set(normalized, entry.name);
      }
    }
  }
  console.log(`${kind}: ${entries.length} units with ${prompts.size} routing cases`);
}

assert(corpus.schema_version === 1, "routing corpus must use schema_version 1");
const routedSkills = await skillNames();
const routedAgents = await agentNames();
validateCases("skills", routedSkills, corpus.skills);
validateCases("agents", routedAgents, corpus.agents);

assert(Array.isArray(corpus.overlap_cases) && corpus.overlap_cases.length >= 6, "routing corpus needs overlap cases");
const routableNames = new Set([...routedSkills, ...routedAgents]);
const overlapPrompts = new Set();
for (const entry of corpus.overlap_cases) {
  assert(typeof entry.prompt === "string" && entry.prompt.length >= 12, "overlap case needs a prompt");
  assert(Array.isArray(entry.expected) && entry.expected.length > 0, "overlap case needs expected routes");
  assert(
    new Set(entry.expected).size === entry.expected.length,
    `overlap case repeats a route: ${entry.prompt}`,
  );
  const unknownRoutes = entry.expected.filter((name) => !routableNames.has(name));
  assert(
    unknownRoutes.length === 0,
    `overlap case references unknown routes: ${unknownRoutes.join(", ")}`,
  );
  assert(typeof entry.reason === "string" && entry.reason.length >= 12, "overlap case needs a reason");
  const normalizedPrompt = entry.prompt.trim().toLowerCase();
  assert(!overlapPrompts.has(normalizedPrompt), `overlap prompt is duplicated: ${entry.prompt}`);
  overlapPrompts.add(normalizedPrompt);
}
console.log(`overlap: ${corpus.overlap_cases.length} catalog boundary cases`);
