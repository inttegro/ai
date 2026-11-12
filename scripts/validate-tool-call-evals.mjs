#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadToolCallSuite } from "../src/tool-calls/corpus.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const suite = await loadToolCallSuite({ root });
const profiles = Object.keys(suite.profiles).sort();
const categories = [...new Set(suite.cases.map((testCase) => testCase.category))].sort();

for (const profile of profiles) {
  const count = suite.cases.filter((testCase) => testCase.profile === profile).length;
  console.log(`${profile}: ${count} behavioral tool-call cases`);
}
console.log(`${suite.cases.length} cases across ${categories.length} categories; ${suite.tools.length} known MCP tools`);
