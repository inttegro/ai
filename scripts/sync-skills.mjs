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

async function assertDirectory(path, label) {
  const value = await stat(path).catch(() => null);
  if (!value?.isDirectory()) throw new Error(`${label} is missing: ${path}`);
}

async function compare() {
  await assertDirectory(sourceRoot, "Standalone skills directory");
  await assertDirectory(pluginRoot, "Plugin skills directory");

  const sourceFiles = await listFiles(sourceRoot);
  const pluginFiles = await listFiles(pluginRoot);
  const differences = [];

  if (JSON.stringify(sourceFiles) !== JSON.stringify(pluginFiles)) {
    differences.push("the skill file lists differ");
  }

  for (const path of sourceFiles) {
    const [source, bundled] = await Promise.all([
      readFile(join(sourceRoot, path)),
      readFile(join(pluginRoot, path)).catch(() => null),
    ]);
    if (!bundled || !source.equals(bundled)) differences.push(path);
  }

  if (differences.length) {
    throw new Error(
      `Standalone and plugin skills are out of sync:\n- ${differences.join("\n- ")}\nRun node scripts/sync-skills.mjs.`,
    );
  }
}

if (checkOnly) {
  await compare();
  console.log("Standalone and plugin skills are in sync.");
} else {
  await assertDirectory(sourceRoot, "Standalone skills directory");
  await rm(pluginRoot, { recursive: true, force: true });
  await cp(sourceRoot, pluginRoot, {
    recursive: true,
    filter: (path) => !ignoredNames.has(relative(sourceRoot, path)),
  });
  await compare();
  console.log("Synchronized standalone skills into the Inttegro plugin.");
}
