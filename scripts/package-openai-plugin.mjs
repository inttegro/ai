#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const pluginName = readArgument("--plugin-name") ?? process.env.OPENAI_PLUGIN_NAME;
if (!pluginName?.startsWith("app-")) {
  throw new Error(
    "Pass the existing OpenAI package name with --plugin-name app-... or OPENAI_PLUGIN_NAME.",
  );
}

const source = join(root, "plugins", "inttegro");
const portableManifest = JSON.parse(await readFile(join(source, "plugin.json"), "utf8"));
const output = resolve(
  root,
  readArgument("--output") ?? `dist/inttegro-openai-${portableManifest.version}.zip`,
);
const temporaryRoot = await mkdtemp(join(tmpdir(), "inttegro-openai-plugin-"));
const staging = join(temporaryRoot, "package");

try {
  execFileSync(process.execPath, [join(root, "scripts", "validate-public-package.mjs")], {
    cwd: root,
    stdio: "inherit",
  });

  await cp(source, staging, { recursive: true });
  const manifestPath = join(staging, "plugin.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.name = pluginName;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  await mkdir(dirname(output), { recursive: true });
  await rm(output, { force: true });
  execFileSync("zip", ["-q", "-r", output, ".", "-x", "*.DS_Store"], {
    cwd: staging,
    stdio: "inherit",
  });

  console.log(`Created ${basename(output)} for ${pluginName}`);
  console.log(output);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
