# Contributing

Thanks for your interest in contributing to Kamyaabi. This doc covers the minimum
you need to know before opening a pull request.

## Branches

- `master` is always deployable; all work lands via pull requests.
- Feature branches use the following prefixes:

  | Prefix      | Use for                                      |
  | ----------- | -------------------------------------------- |
  | `feature/`  | new user-facing functionality                |
  | `fix/`      | bug fixes                                    |
  | `refactor/` | restructuring with no behaviour change       |
  | `chore/`    | tooling, CI, deps, docs, infra               |
  | `docs/`     | docs-only changes                            |
  | `test/`     | test-only changes                            |

  Example: `feature/cart-quantity-stepper`, `fix/google-login-cold-start`.

## Commit messages — Conventional Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body — what changed and why, wrapped at ~72 chars>
```

Common `type`s: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `ci`, `build`, `style`.

Examples:

```
feat(cart): optimistic quantity updates with rollback on failure
fix(auth): retry verifier init on cold-start Google cert fetch
refactor(exception): use ApiErrorResponse with traceId in global handler
docs(logging): document /actuator/loggers runtime level toggle
```

Breaking changes: append `!` after the type/scope (e.g. `feat(api)!: ...`) and
add a `BREAKING CHANGE:` trailer explaining the migration.

## Pull requests

Before opening a PR:

- [ ] Branch is rebased onto latest `master`.
- [ ] Backend: `mvn -pl kamyaabi-backend verify` passes locally (or at least `mvn test`).
- [ ] Frontend: `npm -C kamyaabi-frontend run build` passes (TypeScript + Vite).
- [ ] No new `console.*` calls in `kamyaabi-frontend/src` — use `utils/logger.ts`.
- [ ] No new `System.out.println` in `kamyaabi-backend/src` — use SLF4J.
- [ ] Secrets are externalised via env vars — nothing hardcoded.
- [ ] Added/updated Javadoc on any new public backend class/method.
- [ ] Updated `CHANGELOG.md` under `## [Unreleased]` when the change is user-visible.

PR descriptions should include:

1. **Summary** — one sentence, mirrors the commit subject.
2. **Why** — motivation / context.
3. **What changed** — bullet list of the notable changes.
4. **Testing** — how you verified (unit tests, manual, screenshots).

## Code review guidelines

Reviewers focus on:

- **Correctness** — does the code do what the PR claims?
- **Layering** — no business logic in controllers / React components; API calls stay in `src/api/`.
- **Types** — backend: no raw entity returns from controllers; frontend: no `any`.
- **Observability** — meaningful log lines, correlation id present, non-trivial errors go through the logger.
- **Tests** — new behaviour is covered; modified behaviour has its test updated.

Authors should:

- Respond to every comment (even "done").
- Push follow-up commits instead of amending the original one during review.
- Only merge once CI is green and at least one reviewer has approved.

## Running the stack locally

See the **Local development setup** section of [`README.md`](./README.md) for
backend + frontend quickstart commands.
