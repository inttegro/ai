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
npx -y @anthropic-ai/claude-code@2.1.269 plugin validate . --strict
npx -y @anthropic-ai/claude-code@2.1.269 plugin validate plugins/inttegro --strict
```

Never commit credentials, access tokens, production exports, customer information, or private source copied from Inttegro services.

By contributing, you agree that your contribution is licensed under this repository's MIT License unless the affected subdirectory states otherwise.
