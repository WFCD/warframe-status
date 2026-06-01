# Generated worldstate DTOs

This directory is **not tracked in git** (except this README). Files here are produced by codegen from [`warframe-worldstate-parser`](https://github.com/WFCD/warframe-worldstate-parser) and exist on disk only after generation.

## Why

- Source of truth is the parser package plus `scripts/generate-worldstate-dtos.ts`, not committed copies of the output.
- Parser version bumps would otherwise create large, noisy diffs across dozens of files.
- OpenAPI shape is validated at runtime by `src/test/e2e/openapi.spec.ts`.
- Generated TypeScript is formatted with Biome (`biome check --write --unsafe`) after each run.

## When files are created

Codegen runs automatically via:

- `npm install` / `npm ci` — `prepare` script
- `npm run build`, `dev`, or `start`

Related output (also gitignored):

- `src/controllers/worldstate-field-routes.generated.ts` — from `npm run generate:routes`

## Manual regeneration

```bash
npm run generate:dtos
npm run generate:routes
```

Use `--check` on the DTO generator to verify output without writing files:

```bash
npm run generate:dtos -- --check
```

## Fresh clone

After `npm install`, this directory should contain `*.dto.ts` files and `index.ts`. If imports fail in the editor, run the commands above.
