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

const server = await readJson("registry/inttegro/server.json");
assert(server.name === "com.inttegro/mcp", "registry namespace must be com.inttegro/mcp");
assert(server.version === "0.1.0", "registry version must match the MCP implementation version");
assert(
  server.remotes?.some(
    (remote) =>
      remote.type === "streamable-http" && remote.url === "https://mcp.inttegro.com/",
  ),
  "registry metadata must advertise the canonical Streamable HTTP endpoint",
);

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
const internalPluginSkills = pluginSkills.filter((name) => !skills.includes(name));
const requiredMerchantWorkflows = [
  "inttegro-collect-unpaid-orders",
  "inttegro-customer-care",
  "inttegro-daily-brief",
  "inttegro-files",
  "inttegro-fulfill-and-close",
  "inttegro-launch-offer",
  "inttegro-message-templates",
  "inttegro-order-desk",
  "inttegro-payment-refund",
  "inttegro-reconciliation",
  "inttegro-resolve-customer-case",
  "inttegro-sell-by-link",
];
assert(pluginSkills.length === 20, `expected 20 plugin skills, found ${pluginSkills.length}`);
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
  "commerce-analyst.md",
  "customer-journey-investigator.md",
  "customer-resolution-specialist.md",
  "order-operations-manager.md",
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
}

console.log(
  `Validated portable plugin, registry metadata, ${skills.length} public developer skills, ${internalPluginSkills.length} internal merchant workflows, and ${agents.length} agents.`,
);
