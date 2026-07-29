# Conventions

Companion to [AGENTS.md](./AGENTS.md). AGENTS.md explains the _why_;
this file explains the _how_. AI tools (Codex, Claude Code) MUST follow
these conventions when proposing commits, edits, or refactors.

## Tooling

- Package manager: **pnpm**. Always run scripts and install via `pnpm <cmd>`.
  Never use `npm`, `yarn`, or `bun` in this repo. The `packageManager` field
  in `package.json` will be pinned to a specific pnpm version.
- Workspace scripts (e.g. `pnpm test`, `pnpm lint`, `pnpm format`) are the
  only sanctioned way to run the underlying tools; do not invoke `vitest`,
  `eslint`, or `prettier` directly unless a script is missing.

## Commit message convention

Format: [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>[optional scope]: <subject>

<body>

<footer>
```

### Allowed types

| Type     | Use for                                                 |
| -------- | ------------------------------------------------------- |
| feat     | New user-facing feature                                 |
| fix      | Bug fix                                                 |
| refactor | Code change that neither fixes a bug nor adds a feature |
| perf     | Performance improvement                                 |
| test     | Adding or fixing tests only                             |
| docs     | Docs only                                               |
| build    | Build system or external dependency change              |
| ci       | CI configuration                                        |
| chore    | Other changes (no src/test impact)                      |
| style    | Formatting only (whitespace, semicolons)                |
| revert   | Reverts a previous commit                               |

### Allowed scopes (project-specific)

| Scope    | Area                                              |
| -------- | ------------------------------------------------- |
| engine   | Core engine: windowing, events, logging, input    |
| renderer | 2D/3D renderer, materials, lighting               |
| editor   | ImGui-style editor UI (React + Tailwind)          |
| scene    | ECS, scene graph, serialization                   |
| ui       | Shared React primitives                           |
| state    | Zustand stores                                    |
| types    | Shared TypeScript types                           |
| deps     | Dependency changes                                |
| config   | Tooling config (vite, eslint, prettier, tsconfig) |
| docs     | Docs outside AGENTS.md / CONVENTIONS.md           |

If a commit genuinely doesn't fit any scope, prefer `chore` over inventing one.

### Rules

- **Scope**: optional. When present, use one of the project-specific scopes
  above.
- **Subject**: imperative mood, no trailing period, <= 72 chars, lowercase after the colon.
- **Body**: explain _why_, not _what_. Wrap at ~72 chars. Omit the body if the subject is self-explanatory.
- **Footer**: reference issues (`Refs: #123`) or note breaking changes (`BREAKING CHANGE: <note>`).
- One logical change per commit. If you need `and` in the subject, split the commit.

### Example

```
feat(renderer): batch 2D quad submission into a single arena VBO

Replaces per-draw-call vertex uploads with a single arena-allocated
VBO per frame. Cuts draw calls from O(n) to 1 for typical UI scenes
and removes the GC pressure from per-frame typed arrays.

Refs: #42
```

## Code conventions

### Language and types

- TypeScript `strict` mode is the default. Never weaken it without a comment justifying why.
- Prefer `type` aliases over `interface` unless declaration merging is needed.
- Avoid `any`. Use `unknown` and narrow, or define a real type.
- Export types next to the code that owns them. Promote to `src/types/` only when shared across >= 3 modules.

### Naming

| Thing                  | Style                      | Example                        |
| ---------------------- | -------------------------- | ------------------------------ |
| Files and folders      | `kebab-case`               | `event-bus.ts`, `renderer-2d/` |
| React components       | `PascalCase`               | `Viewport.tsx`                 |
| Functions, vars, hooks | `camelCase`                | `submitQuad`, `isKeyPressed`   |
| Compile-time constants | `UPPER_SNAKE`              | `MAX_QUADS_PER_BATCH`          |
| Types and classes      | `PascalCase`               | `RenderCommand`, `OrthoCamera` |
| Booleans               | `is/has/can/should` prefix | `isKeyPressed`, `hasFocus`     |

### Imports and modules

- Use the package-private alias for imports within a package's `src/` tree:
  `#engine/...` in engine and `#sandbox/...` in sandbox. Each package owns its
  alias through its `package.json` `imports` map, so engine imports still
  resolve when Vite consumes its source. Do not use relative source imports or
  a bundle-global `@/...` alias.
- Group order, separated by blank lines:
  1. Node / standard library
  2. External packages
  3. Internal workspace packages and package-private aliases
  4. Type-only imports
- Type-only imports use `import type` so they're elided at runtime.

### React

- Function components only. No class components.
- Hooks at the top of the component; no conditional hooks.
- Default to local state; lift to context or Zustand only when actually shared.
- Zustand stores live in `src/state/`, one store per file, named `<thing>-store.ts`.
- Co-locate component-specific styles, tests, and helpers with the component.

### Engine code (the heart of this project)

- Engine packages MUST NOT import React. Browser APIs enter through explicit host inputs, such as an injected canvas, or through platform/backend modules.
- Engine code does not query ambient DOM state to discover host elements. The consumer owns DOM placement and passes required elements at the composition root.
- API-neutral renderer code does not read the DOM. Graphics API calls belong in their WebGL or WebGPU backend.
- ECS data is data; systems are pure functions over data where possible.
- Each engine module ships with at least one unit test before being marked "done" in AGENTS.md.

### Comments

The TS type signature already says *what*. Comments exist to say *why* — design
intent, non-obvious constraints, or contracts the type system can't express.
The bar for adding a comment is "would removing it cost a future reader real
time?"

Pick the form by **scope**, not by taste:

- **Public API boundary** — symbols re-exported from a package's `src/index.ts`,
  or anything a consumer calls directly across a module boundary — gets
  `/** ... */` JSDoc. This drives IDE hover hints and any future TypeDoc build.
  - Use `@param` / `@returns` / `@typeParam` / `@throws` as appropriate.
  - Cross-references go through `{@link Foo}`, not bare backticks, so they
    resolve in generated docs.
  - Code examples use fenced ```ts blocks, not `//`-indented prose.
- **Internal implementation** — file-local helpers, private fields, data
  constants, design notes — uses `//` line comments. Multi-line `//` is fine
  for a short rationale (3-5 lines); don't force a one-liner into a JSDoc
  block just to look formal.
- **Never** use bare `/* */` block comments. They serve no purpose JSDoc or
  `//` can't, and they make grep noisy.
- **No metadata comments.** No `@author`, `@date`, `@since`. Git already
  records authorship and history; JSDoc tags for it are duplicated state.
- **No doc-comment rot.** When a public signature changes, update its JSDoc
  in the same commit. Stale `@param` text is worse than no JSDoc at all.

### Testing

- Framework: **Vitest** (unit/integration) + **@testing-library/react** (components). **Playwright** may be added later for browser-level / visual tests.
- Test files live next to source as `*.test.ts(x)`. If a test file grows large, move it to a sibling `__tests__/` folder, but keep it close.
- Tests describe _behavior_, not implementation. Refactoring internals should not break tests.
- Every engine module ships with at least one unit test before being marked "done" in AGENTS.md.
- Run `pnpm test` (or the equivalent) before opening a PR or finishing a slice.

### Formatting and lint

- Prettier owns whitespace, quotes, and trailing commas. Never hand-format.
- ESLint owns correctness rules. Never `// eslint-disable` without a comment explaining why.
- Both run via `pnpm lint` and `pnpm format`. CI must pass.

### File layout

Repository layout and package-internal structure live in
[ARCHITECTURE.md](./ARCHITECTURE.md) (it is the single source of truth
for the shape of the codebase). This file covers only code style;
consult ARCHITECTURE.md when deciding _where_ a file goes.

### When in doubt

- Prefer the more boring choice.
- Prefer explicit over clever.
- Prefer fewer files to fewer cross-cutting dependencies.
- If a rule feels wrong, edit this file and commit the change as
  `docs: revise the <topic> convention`.
