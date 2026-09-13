const protocolVersion = "2026-07-28";

function wellKnownUrl(value, name) {
  const source = new URL(value);
  const path = source.pathname === "/" ? "" : source.pathname.replace(/\/$/, "");
  source.pathname = `/.well-known/${name}${path}`;
  source.search = "";
  source.hash = "";
  return source;
}

function result(id, status, summary, detail) {
  return { id, status, summary, ...(detail ? { detail } : {}) };
}

async function request(fetchImpl, url, options, timeoutMs) {
  return fetchImpl(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
}

async function responsePayload(response) {
  const text = await response.text();
  if (!text) return null;
  if (response.headers.get("content-type")?.includes("text/event-stream")) {
    for (const line of text.split(/\r?\n/)) {
      if (!line.startsWith("data:")) continue;
      const value = line.slice(5).trim();
      if (value && value !== "[DONE]") return JSON.parse(value);
    }
    return null;
  }
  return JSON.parse(text);
}

function mcpHeaders(token, sessionId) {
  return {
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
    "MCP-Protocol-Version": protocolVersion,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(sessionId ? { "Mcp-Session-Id": sessionId } : {}),
  };
}

function rpc(method, params, id) {
  return JSON.stringify({ jsonrpc: "2.0", ...(id === undefined ? {} : { id }), method, params });
}

function summarize(checks) {
  return checks.reduce(
    (summary, check) => ({ ...summary, [check.status]: summary[check.status] + 1 }),
    { pass: 0, warn: 0, fail: 0 },
  );
}

async function inspectAuthenticatedCatalog({ fetchImpl, endpoint, token, timeoutMs, checks }) {
  const initialize = await request(
    fetchImpl,
    endpoint,
    {
      method: "POST",
      headers: mcpHeaders(token),
      body: rpc(
        "initialize",
        {
          protocolVersion,
          capabilities: {},
          clientInfo: { name: "inttegro-mcp-doctor", version: "0.1.0" },
        },
        1,
      ),
    },
    timeoutMs,
  );

  if (!initialize.ok) {
    checks.push(
      result(
        "authenticated-initialize",
        "fail",
        `Authenticated initialization returned HTTP ${initialize.status}`,
      ),
    );
    return;
  }

  const payload = await responsePayload(initialize);
  if (!payload?.result || payload.error) {
    checks.push(result("authenticated-initialize", "fail", "Initialization returned no MCP result"));
    return;
  }

  const sessionId = initialize.headers.get("mcp-session-id") || undefined;
  checks.push(
    result(
      "authenticated-initialize",
      "pass",
      `Authenticated MCP initialization succeeded with protocol ${payload.result.protocolVersion ?? "unknown"}`,
    ),
  );

  await request(
    fetchImpl,
    endpoint,
    {
      method: "POST",
      headers: mcpHeaders(token, sessionId),
      body: rpc("notifications/initialized", {}, undefined),
    },
    timeoutMs,
  );

  const toolNames = [];
  let cursor;
  for (let page = 0; page < 20; page += 1) {
    const response = await request(
      fetchImpl,
      endpoint,
      {
        method: "POST",
        headers: mcpHeaders(token, sessionId),
        body: rpc("tools/list", cursor ? { cursor } : {}, page + 2),
      },
      timeoutMs,
    );

    if (!response.ok) {
      checks.push(result("tool-catalog", "fail", `Tool discovery returned HTTP ${response.status}`));
      return;
    }

    const pagePayload = await responsePayload(response);
    if (!Array.isArray(pagePayload?.result?.tools)) {
      checks.push(result("tool-catalog", "fail", "Tool discovery returned no tools array"));
      return;
    }

    toolNames.push(...pagePayload.result.tools.map((tool) => tool.name).filter(Boolean));
    cursor = pagePayload.result.nextCursor;
    if (!cursor) break;
    if (page === 19) {
      checks.push(result("tool-pagination", "fail", "Tool discovery exceeded 20 pages"));
      return;
    }
  }

  checks.push(
    result(
      "tool-catalog",
      toolNames.length ? "pass" : "warn",
      `Discovered ${toolNames.length} authenticated tools`,
      toolNames.length ? toolNames.sort().join(", ") : undefined,
    ),
  );
}

export async function runDoctor({
  endpoint = "https://mcp.inttegro.com/",
  token,
  tokenSource,
  timeoutMs = 10_000,
  fetchImpl = fetch,
} = {}) {
  const checks = [];
  let endpointUrl;

  try {
    endpointUrl = new URL(endpoint);
  } catch {
    return {
      endpoint,
      protocolVersion,
      authenticated: Boolean(token),
      checks: [result("endpoint", "fail", "Endpoint is not a valid URL")],
      summary: { pass: 0, warn: 0, fail: 1 },
    };
  }

  if (endpointUrl.protocol !== "https:" && endpointUrl.hostname !== "localhost") {
    checks.push(result("endpoint", "fail", "Endpoint must use HTTPS outside localhost"));
  } else {
    checks.push(result("endpoint", "pass", `Endpoint uses ${endpointUrl.protocol}`));
  }

  const metadataUrl = wellKnownUrl(endpointUrl, "oauth-protected-resource");
  let metadata;
  try {
    const response = await request(
      fetchImpl,
      metadataUrl,
      { headers: { Accept: "application/json" } },
      timeoutMs,
    );
    if (!response.ok) {
      checks.push(
        result("protected-resource", "fail", `Protected-resource metadata returned HTTP ${response.status}`),
      );
    } else {
      metadata = await response.json();
      checks.push(result("protected-resource", "pass", "Protected-resource metadata is available"));
    }
  } catch (error) {
    checks.push(
      result(
        "protected-resource",
        "fail",
        "Protected-resource metadata could not be read",
        error instanceof Error ? error.message : String(error),
      ),
    );
  }

  if (metadata) {
    const authorizationServers = Array.isArray(metadata.authorization_servers)
      ? metadata.authorization_servers
      : [];
    checks.push(
      result(
        "authorization-servers",
        authorizationServers.length ? "pass" : "fail",
        authorizationServers.length
          ? `Advertises ${authorizationServers.length} authorization server`
          : "No authorization server is advertised",
      ),
    );

    const scopes = Array.isArray(metadata.scopes_supported) ? metadata.scopes_supported : [];
    checks.push(
      result(
        "scopes",
        scopes.length ? "pass" : "warn",
        scopes.length ? `Advertises ${scopes.length} OAuth scopes` : "No OAuth scopes are advertised",
      ),
    );

    for (const authorizationServer of authorizationServers) {
      try {
        const discoveryUrl = wellKnownUrl(authorizationServer, "oauth-authorization-server");
        const response = await request(
          fetchImpl,
          discoveryUrl,
          { headers: { Accept: "application/json" } },
          timeoutMs,
        );
        checks.push(
          result(
            `authorization-metadata:${authorizationServer}`,
            response.ok ? "pass" : "warn",
            response.ok
              ? `Authorization metadata is available for ${authorizationServer}`
              : `Authorization metadata returned HTTP ${response.status} for ${authorizationServer}`,
          ),
        );
      } catch (error) {
        checks.push(
          result(
            `authorization-metadata:${authorizationServer}`,
            "warn",
            `Authorization metadata could not be read for ${authorizationServer}`,
            error instanceof Error ? error.message : String(error),
          ),
        );
      }
    }
  }

  try {
    const response = await request(
      fetchImpl,
      endpointUrl,
      {
        method: "POST",
        headers: mcpHeaders(undefined),
        body: rpc(
          "initialize",
          {
            protocolVersion,
            capabilities: {},
            clientInfo: { name: "inttegro-mcp-doctor", version: "0.1.0" },
          },
          1,
        ),
      },
      timeoutMs,
    );
    const protectedStatus = response.status === 401 || response.status === 403;
    checks.push(
      result(
        "unauthenticated-access",
        protectedStatus ? "pass" : "fail",
        protectedStatus
          ? `Unauthenticated initialization is protected with HTTP ${response.status}`
          : `Unauthenticated initialization unexpectedly returned HTTP ${response.status}`,
      ),
    );
  } catch (error) {
    checks.push(
      result(
        "unauthenticated-access",
        "fail",
        "Unauthenticated initialization probe failed",
        error instanceof Error ? error.message : String(error),
      ),
    );
  }

  if (token) {
    try {
      await inspectAuthenticatedCatalog({ fetchImpl, endpoint: endpointUrl, token, timeoutMs, checks });
    } catch (error) {
      checks.push(
        result(
          "authenticated-catalog",
          "fail",
          "Authenticated catalog inspection failed",
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  } else {
    checks.push(
      result(
        "authenticated-catalog",
        "warn",
        "Authenticated tool discovery was skipped",
        "Use --token-env with a short-lived test-organization OAuth token to include it.",
      ),
    );
  }

  return {
    endpoint: endpointUrl.toString(),
    protocolVersion,
    authenticated: Boolean(token),
    ...(tokenSource ? { tokenSource } : {}),
    checks,
    summary: summarize(checks),
  };
}
