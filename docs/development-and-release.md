# Development and release guide

## Current stack

- Next.js 15.5.21
- React 19
- TypeScript 5
- Zod 3
- Tailwind CSS 3
- Radix UI components
- pnpm 10
- GitHub Actions
- Vercel

The application version is stored in `package.json`. The SCIM schema version and renderer profiles are versioned separately.

## Local prerequisites

Use:

- Node.js 20 or a compatible current LTS version;
- pnpm 10;
- Git.

Confirm versions:

```bash
node --version
pnpm --version
git --version
```

## Install

```bash
git clone https://github.com/sighmoan1/SCIM.git
cd SCIM
pnpm install --no-frozen-lockfile
```

`--no-frozen-lockfile` is currently used by CI and Vercel because the repository lockfile metadata has previously been regenerated across pnpm versions. A future maintenance change should normalise the lockfile and then restore frozen installs.

## Run locally

```bash
pnpm dev
```

Next.js prints the local URL, normally `http://localhost:3000`.

Routes:

- `/` — canonical map workspace;
- `/editor` — SCIM source editor;
- `/review` — proposal review;
- `/legacy` — preserved original mapper.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | start the development server |
| `pnpm build` | create a production Next.js build |
| `pnpm start` | serve an existing production build |
| `pnpm typecheck` | run TypeScript without emitting files |
| `pnpm verify` | run type-checking and production build |
| `pnpm lint` | historical script; verify Next.js lint support before relying on it |

The quality gate used in CI is type-check plus production build.

## Environment variables

The current canonical application does not require an AI provider API key. External AI collaboration works through portable copy and paste.

Vercel may provide:

- `VERCEL_GIT_COMMIT_SHA` — displayed as the short frontend build identifier.

Future environment variables must be documented in:

- `.env.example` without secrets;
- this guide;
- `SECURITY.md` when they affect data disclosure or authentication.

Never commit real credentials.

## GitHub Actions

The `Verify` workflow performs:

1. checkout;
2. pnpm setup;
3. Node setup;
4. `pnpm install --no-frozen-lockfile`;
5. `pnpm typecheck`;
6. `pnpm build`.

A green workflow proves that dependencies installed, TypeScript checked and Next.js built. It does not currently prove interaction correctness, parser round trips, simulation behaviour or accessibility.

See [`testing-strategy.md`](testing-strategy.md).

## Vercel

The GitHub repository is linked to the Vercel project used by the stable deployment.

Expected behaviour:

- a pull request creates a preview deployment;
- a merge to `main` creates a production deployment;
- Vercel reports deployment status back to the commit;
- the frontend displays application, schema and build versions.

Production URL:

```text
https://v0-simple-infrastructure-mapper.vercel.app/
```

## Preview verification

Before merging a user-interface change, check the preview for:

- the expected application version;
- `/`, `/editor`, `/review` and `/legacy` route loading;
- no client hydration errors;
- canonical local workspace loading;
- mobile Navigate and Edit modes;
- proposal acceptance;
- scenario preview;
- copy and download actions;
- visible version information.

Use a clean browser profile or clear SCIM local-storage keys when testing default-state behaviour.

## Common deployment issues

### Vercel says the build completed but deployment failed

Inspect the final lines after `Build Completed`. Vercel may reject a known-vulnerable framework version after a successful compilation.

The project previously used Next.js 15.2.4 and was blocked by Vercel’s vulnerable-version policy. The fix was to upgrade to the patched 15.5 maintenance release, not to bypass the security check.

### pnpm version mismatch

Vercel detects the lockfile format and may select pnpm 10. Keep local, CI and Vercel package-manager versions aligned. If the project pins a version through `packageManager` or Corepack later, document and test that change.

### Peer-dependency warnings

Warnings from transitive UI packages do not necessarily fail the build, but they should not be ignored indefinitely. Confirm actual runtime compatibility before upgrading React, date libraries or component packages.

### Ignored dependency build scripts

pnpm 10 may warn that a package build script such as `sharp` was ignored. Check whether the application uses the affected native feature. Do not approve arbitrary build scripts without reviewing the package and security implications.

### Production URL still shows an old version

Check:

1. the change was merged to `main`;
2. the Vercel status for the merge commit is successful;
3. the frontend version and build SHA;
4. browser cache or service-worker behaviour;
5. whether the URL is a preview or the stable production domain.

## Versioning

SCIM uses three independent versions.

### Application version

Stored in `package.json`, for example `0.5.0`.

Use semantic-version intent:

- patch — compatible fix or small interaction improvement;
- minor — meaningful new capability without breaking portable SCIM;
- major — substantial product or application compatibility break.

### SCIM schema version

Stored in canonical documents and exposed through `SCIM_SCHEMA_VERSION`, currently `0.2`.

Increment when the portable grammar or semantics change. Provide migration for incompatible stored or imported documents.

### Renderer profile

A string such as `scim-radial-1`.

Published profiles are immutable. A changed deterministic rendering contract requires a new identifier.

## Release checklist

1. Confirm the intended application version.
2. Update `package.json`.
3. Update `CHANGELOG.md`.
4. Update affected product and technical documentation.
5. Update examples when grammar or behaviour changed.
6. Run `pnpm verify`.
7. Open a pull request.
8. Confirm GitHub Actions succeeds.
9. Inspect the Vercel preview on desktop and mobile.
10. Confirm schema and renderer compatibility decisions.
11. Merge with squash.
12. Confirm production Vercel status succeeds.
13. Open the stable URL and verify the version footer and primary journeys.

## Rollback

For a bad application release:

- revert the merge commit or deploy the last known-good commit;
- confirm Vercel production status;
- document the regression in the changelog or issue tracker.

For a bad schema or persistence release:

- do not assume reverting code restores user data;
- preserve old local-storage keys until migration consequences are understood;
- provide a recovery path through exported SCIM or stored snapshots;
- document whether affected users need to clear or migrate local data.

## Dependency updates

Treat framework and parser dependencies as high impact.

Before merging:

- review release notes and security advisories;
- run type-check and production build;
- test parser and renderer round trips;
- inspect mobile interactions;
- check Vercel preview status;
- avoid broad dependency churn in a feature pull request.

## Release ownership

A future maintainer may automate releases, but the human releasing remains responsible for verifying:

- portable model compatibility;
- deterministic rendering compatibility;
- local workspace migration;
- AI handoff and proposal review behaviour;
- production deployment and version visibility.