import { runDoctor } from "./doctor.mjs";

const help = `Inttegro MCP doctor

Usage:
  inttegro-mcp-doctor [options]

Options:
  --endpoint URL       MCP endpoint (default: https://mcp.inttegro.com/)
  --token-env NAME     Read an OAuth access token from this environment variable
  --timeout MS         Per-request timeout in milliseconds (default: 10000)
  --json               Print the redacted report as JSON
  --help               Show this help

The command never accepts a token value as an argument and never prints one.`;

function parseArgs(args) {
  const options = {
    endpoint: "https://mcp.inttegro.com/",
    timeoutMs: 10_000,
    json: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help") return { help: true };
    if (argument === "--json") {
      options.json = true;
      continue;
    }
    if (argument === "--endpoint") {
      options.endpoint = args[++index];
      if (!options.endpoint) throw new Error("--endpoint requires a URL");
      continue;
    }
    if (argument === "--token-env") {
      options.tokenEnv = args[++index];
      if (!options.tokenEnv) throw new Error("--token-env requires a variable name");
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(options.tokenEnv)) {
        throw new Error("--token-env must be a valid environment variable name");
      }
      continue;
    }
    if (argument === "--timeout") {
      const value = Number(args[++index]);
      if (!Number.isInteger(value) || value < 100 || value > 120_000) {
        throw new Error("--timeout must be an integer between 100 and 120000");
      }
      options.timeoutMs = value;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

function renderText(report) {
  const labels = { pass: "PASS", warn: "WARN", fail: "FAIL" };
  const lines = ["Inttegro MCP doctor", `Endpoint: ${report.endpoint}`, ""];

  for (const check of report.checks) {
    lines.push(`${labels[check.status]} ${check.summary}`);
    if (check.detail) lines.push(`     ${check.detail}`);
  }

  lines.push(
    "",
    `Summary: ${report.summary.pass} passed, ${report.summary.warn} warnings, ${report.summary.fail} failed`,
  );
  return lines.join("\n");
}

export async function main(args) {
  const options = parseArgs(args);
  if (options.help) {
    console.log(help);
    return;
  }

  const token = options.tokenEnv ? process.env[options.tokenEnv] : undefined;
  if (options.tokenEnv && !token) {
    throw new Error(`Environment variable ${options.tokenEnv} is empty or unavailable`);
  }

  const report = await runDoctor({
    endpoint: options.endpoint,
    token,
    tokenSource: options.tokenEnv,
    timeoutMs: options.timeoutMs,
  });

  console.log(options.json ? JSON.stringify(report, null, 2) : renderText(report));
  if (report.summary.fail > 0) process.exitCode = 1;
}
