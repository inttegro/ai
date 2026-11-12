import { readFile } from "node:fs/promises";

import { main as runDoctor } from "./doctor/cli.mjs";
import { main as runRoutingEvaluation } from "./routing/cli.mjs";
import { main as runToolCallEvaluation } from "./tool-calls/cli.mjs";

const help = `Inttegro AI

Usage:
  inttegro-ai doctor [options]
  inttegro-ai eval routing [options]
  inttegro-ai eval tools [options]
  inttegro-ai --version

Commands:
  doctor        Run read-only Inttegro MCP and OAuth diagnostics
  eval routing  Run the versioned skill and agent routing corpus
  eval tools    Run the versioned MCP tool-call behavior corpus

Use "inttegro-ai <command> --help" for command-specific options.`;

async function packageVersion() {
  const source = await readFile(new URL("../package.json", import.meta.url), "utf8");
  return JSON.parse(source).version;
}

export async function main(args) {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(help);
    return;
  }
  if (args[0] === "--version" || args[0] === "-v") {
    console.log(await packageVersion());
    return;
  }
  if (args[0] === "doctor") {
    await runDoctor(args.slice(1), { version: await packageVersion() });
    return;
  }
  if (args[0] === "eval" && args[1] === "routing") {
    await runRoutingEvaluation(args.slice(2));
    return;
  }
  if (args[0] === "eval" && args[1] === "tools") {
    await runToolCallEvaluation(args.slice(2));
    return;
  }
  if (args[0] === "eval") {
    throw new Error('Unknown evaluation. Use "inttegro-ai eval routing --help" or "inttegro-ai eval tools --help".');
  }
  throw new Error(`Unknown command: ${args[0]}`);
}
