import { spawn } from "node:child_process";

const maximumOutputBytes = 1_048_576;

export function createProcessAdapter({ command, args = [], timeoutMs = 120_000 } = {}) {
  if (!command) throw new Error("adapter command is required");

  return (input) => new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;

    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(Object.assign(new Error(`adapter exceeded ${timeoutMs}ms`), { name: "AdapterTimeoutError" }));
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(Object.assign(new Error("adapter process could not start"), { name: error.name }));
    });
    child.stdout.on("data", (chunk) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes > maximumOutputBytes) {
        child.kill("SIGTERM");
        reject(Object.assign(new Error("adapter output exceeded 1 MiB"), { name: "AdapterOutputError" }));
        return;
      }
      stdout.push(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderrBytes += chunk.length;
      if (stderrBytes > maximumOutputBytes) child.kill("SIGTERM");
    });
    child.stdin.on("error", (error) => {
      reject(Object.assign(new Error("adapter closed its input unexpectedly"), { name: error.name }));
    });
    child.on("close", (code, signal) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(Object.assign(
          new Error(`adapter exited unsuccessfully (${signal ? `signal ${signal}` : `code ${code}`})`),
          { name: "AdapterProcessError" },
        ));
        return;
      }
      try {
        const source = Buffer.concat(stdout).toString("utf8").trim();
        if (!source) throw new Error("adapter returned no JSON");
        resolve(JSON.parse(source));
      } catch (error) {
        reject(Object.assign(new Error("adapter returned invalid JSON"), { name: "AdapterProtocolError" }));
      }
    });

    child.stdin.end(`${JSON.stringify(input)}\n`);
  });
}
