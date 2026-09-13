#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
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

const skills = (await readdir(join(root, "skills"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
assert(skills.length === 13, `expected 13 standalone skills, found ${skills.length}`);

for (const skill of skills) {
  const source = await readFile(join(root, "skills", skill, "SKILL.md"), "utf8");
  assert(source.startsWith("---\n"), `${skill}/SKILL.md must start with YAML frontmatter`);
  assert(source.includes(`\nname: ${skill}\n`), `${skill}/SKILL.md name must match its directory`);
}

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

console.log(`Validated portable plugin, registry metadata, ${skills.length} standalone skills, and ${agents.length} agents.`);
