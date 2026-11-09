# Releasing the Inttegro agent plugin

A manifest version, Git commit, push, tag, directory submission, and verified
installation are separate facts. Record each one independently.

## 1. Freeze the source revision

- Update the portable, Claude, Codex, and Claude marketplace versions together.
- Add the version and date to [CHANGELOG.md](CHANGELOG.md).
- Confirm every agent uses a bounded turn count and only committed MCP tools.
- Confirm public developer skills are synchronized with their plugin copies.

Run:

```bash
node scripts/validate-public-package.mjs
node scripts/sync-skills.mjs --check
node scripts/validate-tool-coverage.mjs
node scripts/validate-skill-routing.mjs
npm --prefix packages/mcp-doctor run check
npm --prefix packages/mcp-doctor test
npm --prefix packages/routing-evals run check
npm --prefix packages/routing-evals test
npm --prefix packages/routing-evals run pack:check
npx -y @anthropic-ai/claude-code@2.1.269 plugin validate . --strict
npx -y @anthropic-ai/claude-code@2.1.269 plugin validate plugins/inttegro --strict
```

When the private Commerce runtime is available, also compare the committed
tool contract with the live source:

```bash
node scripts/validate-tool-coverage.mjs \
  --runtime-source ../mcp/src/tools/catalog.ts
```

## 2. Collect host evidence

Run the versioned routing corpus through each supported host or provider using
`@inttegro/routing-evals`. Use a test organization for adapters that can invoke
live tools. Store the JSONL reports in an approved evidence location, not this
public repository.

For every run, record:

- provider, model, host version, plugin revision, locale, and execution region;
- pass rate by positive, negative, ambiguous, and overlap case;
- token-usage provenance, wall time, model latency, and tool latency;
- selected units, tool-call count and sequence, and semantic outcome;
- explicit `unavailable` or `not_recorded` values when evidence is missing.

Do not record credentials, customer data, raw production payloads, or hidden
model reasoning.

## 3. Publish deliberately

After the release commit has passed review:

1. Push the exact reviewed commit.
2. Create the intended signed tag or release entry.
3. Submit or update each supported directory through its documented process.
4. Record the resulting review, publication, or rejection state separately for
   every directory.

Do not describe a directory as published merely because its repository points
at `master` or a submission was accepted for review.

## 4. Verify the public result

- Resolve the public listing without an authenticated maintainer session.
- Install the released plugin from the public instructions.
- Complete OAuth with a test organization.
- Verify tool discovery matches the intended MCP profile.
- Run one read-only routing case and one explicitly confirmed write case.
- Record the public URL, resolved revision or version, verification time, host,
  and outcome.

Publication is complete only when the listing and installation evidence point
to the intended source revision. Deployment of the hosted MCP service remains a
separate release and verification process.
