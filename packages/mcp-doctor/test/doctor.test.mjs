import assert from "node:assert/strict";
import { createServer } from "node:http";
import { afterEach, test } from "node:test";

import { runDoctor } from "../src/doctor.mjs";

const servers = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))));
});

async function fixture(handler) {
  const server = createServer(handler);
  servers.push(server);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return `http://localhost:${address.port}/`;
}

function json(response, status, value, headers = {}) {
  response.writeHead(status, { "content-type": "application/json", ...headers });
  response.end(JSON.stringify(value));
}

test("passes protected-resource and unauthenticated checks", async () => {
  let origin;
  origin = await fixture((request, response) => {
    if (request.url === "/.well-known/oauth-protected-resource") {
      return json(response, 200, {
        resource: origin,
        authorization_servers: [origin],
        scopes_supported: ["commerce.mcp"],
      });
    }
    if (request.url === "/.well-known/oauth-authorization-server") {
      return json(response, 200, { issuer: origin });
    }
    response.writeHead(401);
    response.end();
  });

  const report = await runDoctor({ endpoint: origin, timeoutMs: 1_000 });
  assert.equal(report.summary.fail, 0);
  assert.equal(report.checks.find((check) => check.id === "unauthenticated-access").status, "pass");
  assert.equal(report.authenticated, false);
});

test("fails when no authorization server is advertised", async () => {
  const origin = await fixture((request, response) => {
    if (request.url === "/.well-known/oauth-protected-resource") {
      return json(response, 200, { scopes_supported: [] });
    }
    response.writeHead(401);
    response.end();
  });

  const report = await runDoctor({ endpoint: origin, timeoutMs: 1_000 });
  assert.equal(report.checks.find((check) => check.id === "authorization-servers").status, "fail");
  assert.ok(report.summary.fail > 0);
});

test("discovers every authenticated tool page without exposing the token", async () => {
  const token = "test-token-that-must-not-appear";
  let origin;
  origin = await fixture(async (request, response) => {
    if (request.url === "/.well-known/oauth-protected-resource") {
      return json(response, 200, {
        resource: origin,
        authorization_servers: [origin],
        scopes_supported: ["commerce.mcp"],
      });
    }
    if (request.url === "/.well-known/oauth-authorization-server") {
      return json(response, 200, { issuer: origin });
    }
    if (request.headers.authorization !== `Bearer ${token}`) {
      response.writeHead(401);
      return response.end();
    }

    let body = "";
    for await (const chunk of request) body += chunk;
    const message = JSON.parse(body);
    if (message.method === "initialize") {
      return json(
        response,
        200,
        {
          jsonrpc: "2.0",
          id: message.id,
          result: { protocolVersion, capabilities: {}, serverInfo: { name: "fixture", version: "1" } },
        },
        { "mcp-session-id": "fixture-session" },
      );
    }
    if (message.method === "notifications/initialized") {
      response.writeHead(202);
      return response.end();
    }
    if (message.method === "tools/list" && !message.params.cursor) {
      return json(response, 200, {
        jsonrpc: "2.0",
        id: message.id,
        result: { tools: [{ name: "get_order" }], nextCursor: "page-2" },
      });
    }
    return json(response, 200, {
      jsonrpc: "2.0",
      id: message.id,
      result: { tools: [{ name: "list_orders" }] },
    });
  });

  const report = await runDoctor({
    endpoint: origin,
    token,
    tokenSource: "INTTEGRO_TEST_TOKEN",
    timeoutMs: 1_000,
  });
  const catalog = report.checks.find((check) => check.id === "tool-catalog");
  assert.equal(catalog.status, "pass");
  assert.match(catalog.summary, /2 authenticated tools/);
  assert.doesNotMatch(JSON.stringify(report), new RegExp(token));
});

const protocolVersion = "2026-07-28";
