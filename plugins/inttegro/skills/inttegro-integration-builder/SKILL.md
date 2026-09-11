---
name: inttegro-integration-builder
description: Design, build, implement, set up, or test an Inttegro API integration. Use when a user wants to integrate Inttegro, choose an official SDK or direct HTTPS, choose Inttegro Checkout or a custom checkout, identify the first API operations, produce instructions for a coding agent, or assess integration readiness. Start with the design_integration MCP tool; do not ask the user to paste an API key.
---

# Inttegro integration builder

Route integration-building requests through Inttegro's live, versioned guidance instead of assembling an architecture from memory.

## Start with the design tool

1. Search the connected Inttegro MCP tools for the exact name `design_integration` and call it before proposing architecture or code.
2. Pass every choice already stated by the user: integration goal, trusted server runtime, SDK preference, and checkout approach.
3. If choices are missing, let MCP elicitation collect them when the host supports it. Otherwise ask only for the missing choices and call `design_integration` with the completed arguments.
4. If the exact tool is unavailable, stop and report that the Inttegro MCP connection or `commerce.mcp` permission needs attention. Do not fabricate its result or silently replace it with generic advice.

## Use the returned contract

- Preserve `plan_version`, `selections`, `recommended_path`, `required_operations`, `implementation_steps`, `documentation`, `test_plan`, and `agent_brief` without inventing fields.
- Treat the returned Studio links as the current API contract. Do not guess request fields, response shapes, lifecycle states, currencies, or minor-unit values.
- Keep Inttegro credentials in trusted server-side secret storage. Never request an API key in this skill, send one to an MCP tool, or place one in browser, mobile, source, logs, or chat.
- When the user authorizes implementation and repository access is available, inspect the application before applying the returned brief. Stop and report any mismatch between the brief, Studio contract, SDK, and repository.

## Verify the integration

After implementation, call `check_integration_readiness` with the declared controls. Use `get_integration_guide` only for a focused follow-up topic such as authentication, checkout, orders, catalog, messaging, idempotency, or testing. Do not claim production readiness until the returned test plan has been run against a disposable or non-production Inttegro application.
