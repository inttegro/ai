#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function readJson(path) {
  return JSON.parse(await readFile(join(root, path), "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const plugin = await readJson("plugins/inttegro/plugin.json");
assert(
  plugin.$schema === "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "plugins/inttegro/plugin.json must target Agent Plugins 1.0",
);
assert(plugin.name === "inttegro", "portable plugin name must be inttegro");
assert(plugin.license === "MIT", "portable plugin must declare its MIT license");

const [codexPlugin, claudePlugin] = await Promise.all([
  readJson("plugins/inttegro/.codex-plugin/plugin.json"),
  readJson("plugins/inttegro/.claude-plugin/plugin.json"),
]);
assert(codexPlugin.version === plugin.version, "Codex and portable plugin versions must match");
assert(claudePlugin.version === plugin.version, "Claude and portable plugin versions must match");
const claudeMarketplace = await readJson(".claude-plugin/marketplace.json");
assert(
  claudeMarketplace.plugins?.find((entry) => entry.name === "inttegro")?.version === plugin.version,
  "Claude marketplace and portable plugin versions must match",
);
const changelog = await readFile(join(root, "plugins", "inttegro", "CHANGELOG.md"), "utf8");
assert(
  changelog.includes(`\n## ${plugin.version} `),
  `plugin changelog must include current version ${plugin.version}`,
);
assert(
  (await stat(join(root, "plugins", "inttegro", "RELEASING.md")).catch(() => null))?.isFile(),
  "plugin must document its release evidence process",
);

const requiredListingUrls = {
  websiteURL: "https://inttegro.com/",
  supportURL: "https://studio.inttegro.dev/inttegro-mcp",
  privacyPolicyURL: "https://inttegro.com/privacy",
  termsOfServiceURL: "https://inttegro.com/terms",
};
for (const [field, expected] of Object.entries(requiredListingUrls)) {
  assert(
    codexPlugin.interface?.[field] === expected,
    `OpenAI MCP review requires interface.${field} to be ${expected}`,
  );
}
const openAIReview = codexPlugin.extensions?.["com.openai"]?.review;
assert(
  openAIReview?.test_cases?.positive?.length === 5,
  "OpenAI MCP review requires exactly five positive test cases",
);
assert(
  openAIReview?.test_cases?.negative?.length === 3,
  "OpenAI MCP review requires exactly three negative test cases",
);
for (const testCase of openAIReview.test_cases.positive) {
  assert(
    testCase.description &&
      testCase.prompt &&
      testCase.tools_triggered &&
      testCase.expected_behavior,
    "each positive OpenAI review case must describe its prompt, tools, and expected behavior",
  );
}
for (const testCase of openAIReview.test_cases.negative) {
  assert(
    testCase.description && testCase.prompt,
    "each negative OpenAI review case must describe its prompt and safety boundary",
  );
}
assert(openAIReview.commerce === true, "OpenAI review must disclose commerce support");
assert(
  typeof openAIReview.commerce_description === "string" &&
    openAIReview.commerce_description.length > 0,
  "OpenAI review must explain the plugin's commerce behavior",
);
assert(
  codexPlugin.extensions?.["com.openai"]?.publication?.release_notes,
  "OpenAI submission must include release notes",
);

const mcp = await readJson("plugins/inttegro/mcp.json");
assert(
  mcp.$schema === "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "plugins/inttegro/mcp.json must target the Agent Plugins MCP schema",
);
assert(
  mcp.mcpServers?.inttegro?.type === "streamable-http" &&
    mcp.mcpServers.inttegro.url === "https://mcp.inttegro.com/",
  "portable plugin must use the canonical Inttegro Streamable HTTP endpoint",
);
const openAIAuth = mcp.mcpServers.inttegro.extensions?.["com.openai"]?.auth;
assert(openAIAuth?.type === "oauth", "OpenAI submission must declare OAuth authentication");
assert(
  openAIAuth.client?.mode === "provided" &&
    openAIAuth.client.clientId === "Xy429Gr0SW4zCUDB" &&
    openAIAuth.client.tokenEndpointAuthMethod === "none",
  "OpenAI submission must use the registered public Inttegro for ChatGPT OAuth client",
);
for (const scope of ["openid", "email", "commerce.mcp", "user:org:read"]) {
  assert(
    openAIAuth.baseScopes?.includes(scope),
    `OpenAI submission OAuth base scopes must include ${scope}`,
  );
}

const server = await readJson("registry/inttegro/server.json");
assert(server.name === "com.inttegro/mcp", "registry namespace must be com.inttegro/mcp");
assert(server.version === "0.1.1", "registry version must match the published metadata version");
assert(
  server.repository?.url === "https://github.com/inttegro/ai" &&
    server.repository.source === "github",
  "registry metadata must advertise the public Inttegro AI repository",
);
assert(
  server.remotes?.some(
    (remote) =>
      remote.type === "streamable-http" && remote.url === "https://mcp.inttegro.com/",
  ),
  "registry metadata must advertise the canonical Streamable HTTP endpoint",
);

const aiPackage = await readJson("package.json");
assert(aiPackage.name === "@inttegro/ai", "public npm package name must be @inttegro/ai");
assert(aiPackage.version === "0.1.0", "public npm package version must match its source release");
assert(aiPackage.publishConfig?.access === "public", "public npm package must publish with public access");
assert(
  aiPackage.bin?.["inttegro-ai"] === "./bin/inttegro-ai.mjs",
  "public npm package must expose the inttegro-ai command",
);
assert(aiPackage.engines?.node === ">=22", "public npm package must require Node 22 or newer");
const aiChangelog = await readFile(join(root, "CHANGELOG.md"), "utf8");
assert(
  aiChangelog.includes(`\n## ${aiPackage.version} `),
  `public npm package changelog must include current version ${aiPackage.version}`,
);
for (const path of [
  "CHANGELOG.md",
  "bin/inttegro-ai.mjs",
  "docs/mcp-doctor.md",
  "docs/routing-evaluations.md",
  "src/cli.mjs",
  "src/doctor/cli.mjs",
  "src/doctor/doctor.mjs",
  "src/routing/cli.mjs",
  "src/routing/corpus.mjs",
  "src/routing/evaluator.mjs",
  "src/routing/process-adapter.mjs",
]) {
  assert((await stat(join(root, path)).catch(() => null))?.isFile(), `public npm package is missing ${path}`);
}

const skills = [];
for (const entry of await readdir(join(root, "skills"), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const manifest = await stat(join(root, "skills", entry.name, "SKILL.md")).catch(() => null);
  assert(manifest?.isFile(), `public skills/${entry.name} must contain SKILL.md`);
  skills.push(entry.name);
}
skills.sort();
const requiredSkills = [
  "inttegro",
  "inttegro-best-practices",
  "inttegro-checkout",
  "inttegro-debug",
  "inttegro-mcp",
  "inttegro-state-sync",
  "inttegro-testing",
  "upgrade-inttegro",
];
assert(
  JSON.stringify(skills) === JSON.stringify(requiredSkills),
  `expected public developer skills ${requiredSkills.join(", ")}; found ${skills.join(", ")}`,
);

for (const skill of skills) {
  const source = await readFile(join(root, "skills", skill, "SKILL.md"), "utf8");
  assert(source.startsWith("---\n"), `${skill}/SKILL.md must start with YAML frontmatter`);
  assert(source.includes(`\nname: ${skill}\n`), `${skill}/SKILL.md name must match its directory`);
  assert(!source.includes("\n  internal: true\n"), `${skill} must remain publicly discoverable`);
  assert(!source.includes("TODO"), `${skill} must not contain scaffold TODOs`);
  assert(
    source.includes("](references/"),
    `${skill}/SKILL.md must route detailed guidance through a reference file`,
  );

  const referenceRoot = join(root, "skills", skill, "references");
  const references = (await readdir(referenceRoot, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name);
  assert(references.length > 0, `${skill} must include at least one reference file`);
  const referenceSources = await Promise.all(
    references.map((name) => readFile(join(referenceRoot, name), "utf8")),
  );
  const guidanceLines = [source, ...referenceSources]
    .join("\n")
    .split("\n")
    .filter((line) => line.trim().length > 0).length;
  assert(
    guidanceLines >= 35,
    `${skill} needs substantive integration guidance; found ${guidanceLines} non-empty lines`,
  );

  const interfaceSource = await readFile(
    join(root, "skills", skill, "agents", "openai.yaml"),
    "utf8",
  );
  assert(
    interfaceSource.includes(`$${skill}`),
    `${skill}/agents/openai.yaml default prompt must mention $${skill}`,
  );
}

const pluginSkills = [];
for (const entry of await readdir(join(root, "plugins", "inttegro", "skills"), {
  withFileTypes: true,
})) {
  if (!entry.isDirectory()) continue;
  const manifest = await stat(
    join(root, "plugins", "inttegro", "skills", entry.name, "SKILL.md"),
  ).catch(() => null);
  assert(manifest?.isFile(), `plugin skill ${entry.name} must contain SKILL.md`);
  pluginSkills.push(entry.name);
}
pluginSkills.sort();
const publicPluginSkills = [
  "best-practices",
  "checkout",
  "debug",
  "integration",
  "mcp",
  "state-sync",
  "testing",
  "upgrade",
];
const internalPluginSkills = pluginSkills.filter((name) => !publicPluginSkills.includes(name));
const requiredMerchantWorkflows = [
  "collect-unpaid-orders",
  "customer-care",
  "daily-brief",
  "files",
  "fulfill-and-close",
  "launch-offer",
  "message-templates",
  "order-desk",
  "payment-refund",
  "reconciliation",
  "resolve-customer-case",
  "sell-by-link",
];
assert(pluginSkills.length === 20, `expected 20 plugin skills, found ${pluginSkills.length}`);
assert(
  publicPluginSkills.every((skill) => pluginSkills.includes(skill)),
  `plugin is missing a shortened public skill name; found ${pluginSkills.join(", ")}`,
);
assert(
  JSON.stringify(internalPluginSkills) === JSON.stringify(requiredMerchantWorkflows),
  `merchant workflows must remain plugin-only; found ${internalPluginSkills.join(", ")}`,
);
for (const skill of internalPluginSkills) {
  const source = await readFile(
    join(root, "plugins", "inttegro", "skills", skill, "SKILL.md"),
    "utf8",
  );
  assert(
    source.includes("\nmetadata:\n  internal: true\n"),
    `${skill} must be marked metadata.internal: true`,
  );
}
for (const skill of pluginSkills) {
  const source = await readFile(
    join(root, "plugins", "inttegro", "skills", skill, "SKILL.md"),
    "utf8",
  );
  assert(
    source.includes(`\nname: ${skill}\n`),
    `plugin skill ${skill} name must match its directory`,
  );
  assert(
    !skill.startsWith("inttegro-") && skill !== "inttegro" && skill !== "upgrade-inttegro",
    `plugin skill ${skill} repeats the inttegro namespace`,
  );
}

const skillsPage = await readJson("skills.sh.json");
assert(
  skillsPage.$schema === "https://skills.sh/schemas/skills.sh.schema.json",
  "skills.sh.json must target the skills.sh schema",
);
assert(skillsPage.notGrouped === "bottom", "skills.sh.json must place ungrouped skills last");
assert(
  Array.isArray(skillsPage.groupings) && skillsPage.groupings.length > 0,
  "skills.sh.json must define at least one grouping",
);
const groupedSkills = skillsPage.groupings.flatMap((group) => {
  assert(
    typeof group.title === "string" && group.title.length > 0,
    "each skills.sh grouping must have a title",
  );
  assert(
    Array.isArray(group.skills) && group.skills.length > 0,
    `skills.sh grouping ${group.title} must include at least one skill`,
  );
  return group.skills;
});
assert(
  new Set(groupedSkills).size === groupedSkills.length,
  "skills.sh.json must not list a skill in more than one grouping",
);
assert(
  JSON.stringify([...groupedSkills].sort()) === JSON.stringify(skills),
  "skills.sh.json must group every standalone skill exactly once",
);

const agents = (await readdir(join(root, "plugins", "inttegro", "agents"), { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
  .map((entry) => entry.name)
  .sort();
const requiredAgents = [
  "catalog-operations-manager.md",
  "commerce-analyst.md",
  "customer-journey-investigator.md",
  "customer-resolution-specialist.md",
  "file-operations-manager.md",
  "finance-reconciliation-specialist.md",
  "messaging-operations-manager.md",
  "order-operations-manager.md",
  "revenue-recovery-manager.md",
  "sales-closer.md",
];
assert(
  JSON.stringify(agents) === JSON.stringify(requiredAgents),
  `expected agent set ${requiredAgents.join(", ")}; found ${agents.join(", ")}`,
);

for (const agent of agents) {
  const source = await readFile(join(root, "plugins", "inttegro", "agents", agent), "utf8");
  const expectedName = agent.slice(0, -3);
  assert(source.startsWith("---\n"), `${agent} must start with YAML frontmatter`);
  assert(source.includes(`\nname: ${expectedName}\n`), `${agent} name must match its filename`);
  assert(source.includes("\nmodel: inherit\n"), `${agent} must inherit the host model`);
  assert(/^maxTurns: \d+$/m.test(source), `${agent} must bound its turn count`);

  const toolNames = [...source.matchAll(/mcp__plugin_inttegro_inttegro__([a-z0-9_]+)/g)]
    .map((match) => match[1]);
  assert(toolNames.length > 0, `${agent} must declare a least-privilege tool set`);
  assert(
    new Set(toolNames).size === toolNames.length,
    `${agent} must not declare a tool more than once`,
  );
  const merchantTools = new Set(
    (await readJson("contracts/inttegro-mcp-tools.json")).profiles.merchant.tools,
  );
  const unknownTools = toolNames.filter((tool) => !merchantTools.has(tool));
  assert(
    unknownTools.length === 0,
    `${agent} references unknown tools: ${unknownTools.join(", ")}`,
  );
}

console.log(
  `Validated portable plugin, registry metadata, ${skills.length} public developer skills, ${internalPluginSkills.length} internal merchant workflows, and ${agents.length} agents.`,
);
