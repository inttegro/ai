# Inttegro MCP doctor

`inttegro-mcp-doctor` performs read-only checks against an Inttegro MCP endpoint:

- HTTPS and protected-resource metadata availability.
- Advertised authorization servers and OAuth scopes.
- Authorization-server discovery.
- Rejection of unauthenticated MCP initialization.
- Optional authenticated initialization and paginated tool discovery.

It never invokes a merchant tool. It accepts an OAuth token only through a
named environment variable and excludes the token from its report.

## Run from source

```bash
node packages/mcp-doctor/bin/inttegro-mcp-doctor.mjs
```

To include the authenticated catalog, use a short-lived token belonging to a
non-production test organization:

```bash
INTTEGRO_TEST_TOKEN=replace_me \
  node packages/mcp-doctor/bin/inttegro-mcp-doctor.mjs \
  --token-env INTTEGRO_TEST_TOKEN
```

Use `--json` to create a machine-readable, redacted support report. Do not save
the environment variable in shell history, source control, or an issue.

## Develop

```bash
npm --prefix packages/mcp-doctor run check
npm --prefix packages/mcp-doctor test
```

The package has no runtime dependencies and requires Node.js 22 or newer.
