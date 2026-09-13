# MCP Registry metadata

This directory contains public discovery metadata for Inttegro's hosted MCP
server. The registry entry points to the remote service; it does not package or
republish Inttegro's private service implementation.

Validate the metadata from the repository root:

```bash
node scripts/validate-public-package.mjs
```

Publishing requires control of the `inttegro.com` namespace. Authenticate with
the official `mcp-publisher` using DNS or HTTP verification, review the exact
versioned metadata, and publish `registry/inttegro/server.json`. Publication is
an external action and is intentionally not part of repository CI.
