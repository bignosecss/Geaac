# Conventions

Companion to [AGENTS.md](./AGENTS.md). AGENTS.md explains the *why*;
this file explains the *how*. AI tools (Codex, Claude Code) MUST follow
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
<type>(<scope>): <subject>

<body>

<footer>
```

### Allowed types

| Type     | Use for                                       |
|----------|-----------------------------------------------|
| feat     | New user-facing feature                       |
| fix      | Bug fix                                       |
| refactor | Code change that neither fixes a bug nor adds a feature |
| perf     | Performance improvement                      |
| test     | Adding or fixing tests only                   |
| docs     | Docs only                                     |
| build    | Build system or external dependency change    |
| ci       | CI configuration                              |
| chore    | Other changes (no src/test impact)            |
| style    | Formatting only (whitespace, semicolons)      |
| revert   | Reverts a previous commit                     |

### Allowed scopes (project-specific)

| Scope      | Area                                           |
|------------|------------------------------------------------|
| engine     | Core engine: windowing, events, logging, input |
| renderer   | 2D/3D renderer, materials, lighting           |
| editor     | ImGui-style editor UI (React + Tailwind)      |
| scene      | ECS, scene graph, serialization               |
| ui         | Shared React primitives                       |
| state      | Zustand stores                                |
| types      | Shared TypeScript types                       |
| deps       | Dependency changes                            |
| config     | Tooling config (vite, eslint, prettier, tsconfig) |
| docs       | Docs outside AGENTS.md / CONVENTIONS.md       |

If a commit genuinely doesn't fit any scope, prefer `chore` over inventing one.

### Rules

- **Subject**: imperative mood, no trailing period, <= 72 chars, lowercase after the colon.
- **Body**: explain *why*, not *what*. Wrap at ~72 chars. Omit the body if the subject is self-explanatory.
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

| Thing                       | Style          | Example                       |
|-----------------------------|----------------|-------------------------------|
| Files and folders           | `kebab-case`   | `event-bus.ts`, `renderer-2d/`|
| React components            | `PascalCase`   | `Viewport.tsx`                |
| Functions, vars, hooks      | `camelCase`    | `submitQuad`, `isKeyPressed`  |
| Compile-time constants      | `UPPER_SNAKE`  | `MAX_QUADS_PER_BATCH`         |
| Types and classes           | `PascalCase`   | `RenderCommand`, `OrthoCamera`|
| Booleans                    | `is/has/can/should` prefix | `isKeyPressed`, `hasFocus` |

### Imports and modules

- Use the path alias (`@/...`) for src-relative imports. No `../../../` chains.
- Group order, separated by blank lines:
  1. Node / standard library
  2. External packages
  3. Internal `@/...`
  4. Type-only imports
- Type-only imports use `import type` so they're elided at runtime.

### React

- Function components only. No class components.
- Hooks at the top of the component; no conditional hooks.
- Default to local state; lift to context or Zustand only when actually shared.
- Zustand stores live in `src/state/`, one store per file, named `<thing>-store.ts`.
- Co-locate component-specific styles, tests, and helpers with the component.

### Engine code (the heart of this project)

- Engine packages MUST NOT import React or DOM-only APIs directly. Go through an abstraction layer (e.g. a `Platform` interface) so the engine is testable in isolation.
- Renderer code is pure: takes a scene + viewport, produces pixels. No direct DOM reads inside render passes.
- ECS data is data; systems are pure functions over data where possible.
- Each engine module ships with at least one unit test before being marked "done" in AGENTS.md.

### Testing

- Framework: **Vitest** (unit/integration) + **@testing-library/react** (components). **Playwright** may be added later for browser-level / visual tests.
- Test files live next to source as `*.test.ts(x)`. If a test file grows large, move it to a sibling `__tests__/` folder, but keep it close.
- Tests describe *behavior*, not implementation. Refactoring internals should not break tests.
- Every engine module ships with at least one unit test before being marked "done" in AGENTS.md.
- Run `pnpm test` (or the equivalent) before opening a PR or finishing a slice.

### Formatting and lint

- Prettier owns whitespace, quotes, and trailing commas. Never hand-format.
- ESLint owns correctness rules. Never `// eslint-disable` without a comment explaining why.
- Both run via `pnpm lint` and `pnpm format`. CI must pass.

### File layout

```
src/
  engine/      # windowing, events, input, logging  (no React)
  renderer/    # 2D, 3D, materials, lighting       (no React)
  scene/       # ECS, scene graph, serialization   (no React)
  editor/      # React + Tailwind editor UI; uses engine via adapters
  ui/          # Shared React primitives (button, panel, ...)
  state/       # Zustand stores
  types/       # Only types shared across >= 3 modules
  utils/       # Only utilities shared across >= 3 modules
```

### When in doubt

- Prefer the more boring choice.
- Prefer explicit over clever.
- Prefer fewer files to fewer cross-cutting dependencies.
- If a rule feels wrong, edit this file and commit the change as `docs(Conventions): ...`.
