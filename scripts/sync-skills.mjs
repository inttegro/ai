#!/usr/bin/env node

import { cp, readdir, readFile, rm, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(repositoryRoot, "skills");
const pluginRoot = join(repositoryRoot, "plugins", "inttegro", "skills");
const checkOnly = process.argv.includes("--check");
const ignoredNames = new Set(["README.md", ".DS_Store"]);

async function listFiles(root, directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredNames.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(root, path)));
    if (entry.isFile()) files.push(relative(root, path));
  }

  return files.sort();
}

async function listSkillDirectories(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifest = await stat(join(root, entry.name, "SKILL.md")).catch(() => null);
    if (manifest?.isFile()) skills.push(entry.name);
  }

  return skills.sort();
}

async function assertDirectory(path, label) {
  const value = await stat(path).catch(() => null);
  if (!value?.isDirectory()) throw new Error(`${label} is missing: ${path}`);
}

async function compare() {
  await assertDirectory(sourceRoot, "Public skills directory");
  await assertDirectory(pluginRoot, "Plugin skills directory");

  const [publicSkills, pluginSkills] = await Promise.all([
    listSkillDirectories(sourceRoot),
    listSkillDirectories(pluginRoot),
  ]);
  const differences = [];

  for (const skill of publicSkills) {
    if (!pluginSkills.includes(skill)) {
      differences.push(`${skill} is missing from the plugin`);
      continue;
    }

    const [sourceFiles, pluginFiles] = await Promise.all([
      listFiles(join(sourceRoot, skill)),
      listFiles(join(pluginRoot, skill)),
    ]);
    if (JSON.stringify(sourceFiles) !== JSON.stringify(pluginFiles)) {
      differences.push(`${skill} has a different file list`);
      continue;
    }

    for (const path of sourceFiles) {
      const [source, bundled] = await Promise.all([
        readFile(join(sourceRoot, skill, path)),
        readFile(join(pluginRoot, skill, path)),
      ]);
      if (!source.equals(bundled)) differences.push(`${skill}/${path}`);
    }
  }

  for (const skill of pluginSkills.filter((name) => !publicSkills.includes(name))) {
    const source = await readFile(join(pluginRoot, skill, "SKILL.md"), "utf8");
    if (!source.startsWith("---\n") || !source.includes("\nmetadata:\n  internal: true\n")) {
      differences.push(`${skill} is plugin-only but not marked metadata.internal: true`);
    }
  }

  if (differences.length) {
    throw new Error(
      `Public and plugin skills are out of sync:\n- ${differences.join("\n- ")}\nRun node scripts/sync-skills.mjs.`,
    );
  }

  return { publicSkills, pluginSkills };
}

if (checkOnly) {
  const { publicSkills, pluginSkills } = await compare();
  console.log(
    `${publicSkills.length} public skills are synchronized; ${pluginSkills.length - publicSkills.length} plugin-only skills remain internal.`,
  );
} else {
  await assertDirectory(sourceRoot, "Public skills directory");
  await assertDirectory(pluginRoot, "Plugin skills directory");

  for (const skill of await listSkillDirectories(sourceRoot)) {
    const target = join(pluginRoot, skill);
    await rm(target, { recursive: true, force: true });
    await cp(join(sourceRoot, skill), target, { recursive: true });
  }

  const { publicSkills, pluginSkills } = await compare();
  console.log(
    `Synchronized ${publicSkills.length} public skills; preserved ${pluginSkills.length - publicSkills.length} internal plugin skills.`,
  );
}
