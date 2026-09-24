# Contributing to Lumen

Thank you for your interest in contributing to **Lumen**! We welcome contributions from the community to help build a robust, modular indexing and application framework for Stellar and Soroban.

Please take a moment to review this guide before submitting issues or pull requests.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How to Claim an Issue](#how-to-claim-an-issue)
3. [Prerequisites](#prerequisites)
4. [Local Setup](#local-setup)
5. [Git Hooks & Pre-commit Quality Checks](#git-hooks--pre-commit-quality-checks)
6. [Monorepo Structure & Available Scripts](#monorepo-structure--available-scripts)
7. [Running Tests](#running-tests)
8. [Code Style & Conventions](#code-style--conventions)
9. [Recommended Pre-PR Command (`pnpm check`)](#recommended-pre-pr-command-pnpm-check)
10. [Commit Message Guidelines](#commit-message-guidelines)
11. [Pull Request & Review Process](#pull-request--review-process)

---

## Code of Conduct

All contributors and maintainers are expected to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please report unacceptable behavior to the project maintainers.

---

## How to Claim an Issue

To prevent duplicate effort and ensure seamless collaboration:

1. **Find an Open Issue**: Browse our [GitHub Issues](https://github.com/utilityjnr1/lumena/issues) or check the project roadmap in [ISSUES.md](./ISSUES.md).
2. **Comment to Claim**: Leave a comment on the issue expressing your interest in working on it (e.g., *"I would like to work on this issue, please assign it to me"*). Wait for assignment or confirmation from a maintainer before starting significant work.
3. **Proposing New Features / Major Changes**: If you wish to propose a new feature, architecture change, or non-trivial refactoring, please open an issue using the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.yml) first to discuss the design and approach with the core team.
4. **Scope & Progress**: Keep your PR scoped to the assigned issue. If you encounter unrelated bugs or potential enhancements while working, open separate issues for them.

---

## Prerequisites

Ensure your system meets the following requirements before getting started:

- **Node.js**: `>= 20.0.0` (LTS recommended)
- **pnpm**: `>= 9.0.0` (Corepack recommended: `corepack enable` or `npm install -g pnpm`)
- **Git**: `>= 2.30.0`
- **Docker & Docker Compose**: Required for running the local Stellar / Soroban quickstart standalone network.

---

## Local Setup

### 1. Fork and Clone the Repository

Fork the repository on GitHub, then clone your fork locally:

```bash
git clone https://github.com/<your-username>/lumena.git
cd lumena
```

Add the upstream remote:

```bash
git remote add upstream https://github.com/utilityjnr1/lumena.git
```

### 2. Install Dependencies

Install all dependencies across the monorepo using `pnpm`:

```bash
pnpm install
```

> **Note**: `pnpm install` will automatically trigger the `prepare` script (`husky`), which sets up the local Git hooks in your `.husky/` directory.

### 3. Build the Project

Lumen uses [Turborepo](https://turbo.build/) to orchestrate builds across all workspace packages:

```bash
pnpm build
```

### 4. (Optional) Run the Local Stellar Network

To spin up a local Stellar/Soroban quickstart node for end-to-end testing:

```bash
docker compose -f docker/docker-compose.yml up -d stellar
```

---

## Git Hooks & Pre-commit Quality Checks

This repository uses **[Husky](https://typicode.github.io/husky/)** and **[lint-staged](https://github.com/lint-staged/lint-staged)** to ensure all staged code adheres to linting and formatting rules prior to commit.

### Setup

Git hooks are automatically configured upon running `pnpm install` via the `prepare` script in `package.json`:

```bash
pnpm prepare
```

### How It Works

Whenever you execute `git commit`:
1. Husky executes the pre-commit hook defined in `.husky/pre-commit`.
2. The hook triggers `lint-staged`.
3. `lint-staged` inspects all staged `.ts` and `.tsx` files, running:
   - `eslint --fix` (enforcing lint rules and fixing auto-fixable issues)
   - `prettier --write` (enforcing formatting standards)
4. Any modified files are automatically re-staged. If errors cannot be auto-fixed, the commit will be blocked until the errors are addressed.

You can also run lint-staged manually at any time on staged files:

```bash
pnpm exec lint-staged
```

---

## Monorepo Structure & Available Scripts

Lumen is organized as a monorepo under `packages/`:

| Package | Path | Description |
| --- | --- | --- |
| `@lumen/core` | `packages/core` | Core indexing models, pipeline primitives, and Soroban event ingestion |
| `@lumen/server` | `packages/server` | Fastify-based GraphQL and REST API server |
| `@lumen/web-sdk` | `packages/web-sdk` | TypeScript client library for integrating with Lumen |
| `@lumen/react` | `packages/react` | React hooks and providers for frontend applications |
| `@lumen/cli` | `packages/cli` | CLI tooling for schema generation, config management, and running nodes |

### Root NPM Scripts

| Command | Action |
| --- | --- |
| `pnpm build` | Builds all packages via Turborepo |
| `pnpm dev` | Starts development mode with watch/rebuild across packages |
| `pnpm test` | Runs the test suites across all packages |
| `pnpm check` | **Recommended**: Runs linting, typechecking, and tests in parallel |
| `pnpm lint` | Runs ESLint across the codebase |
| `pnpm lint:fix` | Runs ESLint and automatically applies fixes |
| `pnpm format` | Formats all files with Prettier |
| `pnpm format:check` | Checks code formatting against Prettier rules |
| `pnpm typecheck` | Runs TypeScript compiler checks across all packages |

---

## Running Tests

Lumen uses [Vitest](https://vitest.dev/) for unit and integration testing.

### Run All Tests

To run the complete test suite across all monorepo packages:

```bash
pnpm test
```

### Run Tests for a Specific Package

You can target a specific package using Turbo/pnpm filtering:

```bash
# Run tests only in @lumen/core
pnpm --filter @lumen/core test

# Run tests only in @lumen/server
pnpm --filter @lumen/server test

# Run tests only in @lumen/web-sdk
pnpm --filter @lumen/web-sdk test

# Run tests only in @lumen/react
pnpm --filter @lumen/react test

# Run tests only in @lumen/cli
pnpm --filter @lumen/cli test
```

You can also navigate to any package folder and run:

```bash
cd packages/core
pnpm test
```

---

## Code Style & Conventions

We follow strict code quality standards to keep the codebase maintainable, consistent, and type-safe.

### 1. ESLint Configuration

Our lint rules are defined in [`eslint.config.js`](./eslint.config.js):
- Enforces `@typescript-eslint/recommended` rules.
- Disallows unused variables (`@typescript-eslint/no-unused-vars`), with exceptions for prefix `_` (e.g., `_event`, `_ctx`).
- Disallows loose `any` typing (`@typescript-eslint/no-explicit-any` warning).
- Enforces explicit type-only imports: `@typescript-eslint/consistent-type-imports` (`import type { ... } from "..."`).
- Disallows raw `console.log` statements (`no-console` with warning, allowing `console.warn` and `console.error`).

To check or auto-fix linting:

```bash
pnpm lint
pnpm lint:fix
```

### 2. Prettier Configuration

Our formatting rules are configured in [`.prettierrc`](./.prettierrc):
- Semicolons: `true`
- Quotes: Double quotes (`"`)
- Trailing commas: `"all"`
- Print width: `100` characters
- Tab width: `2` spaces

To verify or format files:

```bash
pnpm format:check
pnpm format
```

### 3. TypeScript Guidelines

- Always favor strict typing. Provide full interfaces and types for Soroban event payloads, transaction envelopes, and API models.
- Avoid casting with `as any`. If type narrowing is needed, write explicit type guards.
- Use explicit return types for public functions and API handlers.

---

## Recommended Pre-PR Command (`pnpm check`)

Before committing or opening a pull request, run the unified verification script:

```bash
pnpm check
```

This command runs `turbo lint typecheck test` in parallel across all packages:
- **`lint`**: Ensures code passes ESLint rules.
- **`typecheck`**: Verifies that TypeScript types compile cleanly without errors.
- **`test`**: Runs all unit tests to guarantee that no regressions have been introduced.

Running `pnpm check` locally ensures your PR will pass our continuous integration (CI) pipeline on GitHub Actions.

---

## Commit Message Guidelines

We enforce the [Conventional Commits](https://www.conventionalcommits.org/) specification for all commits.

### Format

```text
<type>(<scope>): <short summary in imperative mood>

[optional body explaining what was done and why]

[optional footer(s), e.g. Closes #123]
```

### Types

- **`feat`**: A new user-facing feature or API capability.
- **`fix`**: A bug fix.
- **`docs`**: Documentation updates or additions.
- **`test`**: Adding new tests or refactoring existing tests.
- **`refactor`**: Code changes that neither fix a bug nor add a feature.
- **`perf`**: Performance optimizations.
- **`style`**: Changes that do not affect the meaning of the code (formatting, white-space, etc.).
- **`build`**: Changes that affect the build system or external dependencies (e.g. Turbo, pnpm).
- **`ci`**: Changes to CI configuration files and scripts (GitHub Actions).
- **`chore`**: Maintenance tasks, tooling updates, or miscellaneous tasks.

### Examples

```text
feat(core): add soroban event filter by topic wildcard
```

```text
fix(server): resolve race condition in block polling loop

Closes #112
```

```text
docs(web-sdk): add pagination examples for getTransactions query
```

---

## Pull Request & Review Process

1. **Create a Topic Branch**: Branch off `main` with a clear, descriptive name:
   ```bash
   git checkout -b fix/issue-123-short-description
   # or
   git checkout -b feat/add-payment-filter
   ```
2. **Implement Your Changes**: Write clean, documented code and include unit tests demonstrating your changes work as intended.
3. **Verify Locally**: Run the pre-PR check:
   ```bash
   pnpm check
   ```
4. **Push and Open PR**:
   - Push your branch to your fork: `git push -u origin <branch-name>`
   - Open a PR against `main` on the upstream repository.
   - Fill out all sections of the [Pull Request Template](.github/pull_request_template.md).
   - Reference the issue(s) being resolved (e.g., `Fixes #130`).
5. **CI & Review**:
   - Ensure all automated GitHub Actions checks pass.
   - Address any review comments or requested changes promptly.
   - Once approved and checks are green, maintainers will squash and merge your contribution.
