# Contributing

Thanks for helping make Inttegro's public AI tooling more useful.

## Good contributions

- Improve an existing plugin, skill, example, or protocol adapter.
- Add tests or documentation for a public interface.
- Fix unsafe, ambiguous, or unreliable agent instructions.
- Propose a small tool that can be used without exposing Inttegro's private services or customer data.

Open an issue before starting a large package or architectural change so the public boundary and maintenance plan are clear.

## Development workflow

1. Fork or clone the repository.
2. Create a focused branch.
3. Make the smallest coherent change.
4. Run the validation documented by the affected project.
5. Open a pull request that explains the behavior, security impact, and verification performed.

For the Inttegro agent plugin, run:

```bash
node scripts/validate-public-package.mjs
node scripts/sync-skills.mjs --check
node scripts/validate-tool-coverage.mjs
node scripts/validate-skill-routing.mjs
npx -y @anthropic-ai/claude-code@2.1.269 plugin validate . --strict
npx -y @anthropic-ai/claude-code@2.1.269 plugin validate plugins/inttegro --strict
```

The top-level `skills/` directories are the canonical public developer skills.
The plugin bundles byte-for-byte copies and can also contain authenticated
merchant workflows marked `metadata.internal: true`. After changing a public
skill, run `node scripts/sync-skills.mjs` and commit both copies. Do not move a
merchant operation into the public catalog merely to make it independently
installable.

The committed MCP tool contract in `contracts/inttegro-mcp-tools.json` must be
updated whenever a profile's tool catalog changes. Every tool needs compatible
skill or agent coverage. Every skill and agent needs positive, negative, and
ambiguous routing cases in `evals/routing.json`.

When the private runtime source is available in the parent Commerce workspace,
also run `node scripts/validate-tool-coverage.mjs --runtime-source
../mcp/src/tools/catalog.ts`. Before a release, compare an authenticated,
redacted `mcp-doctor --json` report with the matching profile as documented in
`evals/README.md`.

`products/shop-with-inttegro` is an activation-gated consumer product
definition, not an installable plugin. Do not publish or list it until every
gate in its `product.json` has passed and the reviewed provider OAuth client is
allowlisted for the isolated consumer profile.

Never commit credentials, access tokens, production exports, customer information, or private source copied from Inttegro services.

By contributing, you agree that your contribution is licensed under this repository's MIT License unless the affected subdirectory states otherwise.
