# Architecture

Companion to [AGENTS.md](./AGENTS.md) (the _why_) and
[CONVENTIONS.md](./CONVENTIONS.md) (the _how_). This file describes
the _what_: system shape, packages, dependency rules, the
browser/runtime model, and the reasoning behind non-trivial decisions.

## System overview

GEAAC ports TheCherno's Hazel game-engine architecture to the web.
The system is a pnpm-workspaces monorepo with two packages today
(engine and sandbox) and a third (editor) planned.

```mermaid
flowchart LR
  Browser[Browser] -->|loads bundle| Sandbox[sandbox<br/>Vite + React]
  Sandbox -->|workspace import| Engine[engine<br/>pure TS lib]
```

In the browser there is exactly one bundle. The package boundary
exists at build time (import resolution) and at source time
(folder separation), not at runtime.

## Repository layout

```text
Geaac/                          workspace root
|-- AGENTS.md
|-- CONVENTIONS.md
|-- ARCHITECTURE.md             this file
|-- package.json                root: scripts + devDeps only
|-- pnpm-workspace.yaml         declares packages/*
|-- tsconfig.base.json          shared TS strict settings
|-- .gitignore
|-- .npmrc
`-- packages/
    |-- engine/                 pure TS lib, no React, no DOM
    |   |-- package.json        name: @geaac/engine
    |   |-- tsconfig.json       composite, references: []
    |   `-- src/
    |       |-- index.ts        barrel, public API
    |       `-- ...             modules: log, event-bus, ...
    |
    `-- sandbox/                Vite + React app, depends on engine
        |-- package.json        name: @geaac/sandbox
        |-- tsconfig.json       references engine
        |-- vite.config.ts
        |-- index.html
        `-- src/
            |-- main.tsx
            |-- app.tsx
            `-- ...
```

## Packages

### `@geaac/engine`

Role: pure TypeScript library. All reusable engine code lives here.

Constraints:

- No React in `dependencies` or `devDependencies`.
- No browser-only APIs (`window`, `document`, `canvas`, ...).
- No imports from `@geaac/sandbox` or any future sibling package.

Why: keeps engine code testable in Node without a DOM, and reusable
across any consumer (sandbox today, editor tomorrow, third-party app
later). The package boundary is what enforces this; a lint rule
alone would not be sufficient.

Status: scaffolded (public API, entry-point protocol, version module).
Next: first real runtime slice.

### `@geaac/sandbox`

Role: the consumer app. Runs and visualizes the engine.

Constraints: none. It is the top of the dependency graph.

Why: gives us a runnable artifact to validate engine behavior in a
real browser, and is the natural host for ad-hoc experiments while
developing engine modules.

Status: scaffolded (Vite + React 19, configures an engine application).

### `@geaac/editor` (planned)

Role: ImGui-style editor UI built on top of the engine.

Status: not yet scaffolded. Added when we reach the editor episode
in TheCherno's series.

## Dependency rules

The whole architecture is encoded in this matrix:

| From    | May import                                         |
| ------- | -------------------------------------------------- |
| engine  | node stdlib, own modules                           |
| sandbox | engine, React, third-party libs                    |
| editor  | engine, sandbox rarely, React, Tailwind, shadcn/ui |

Enforced by package boundaries. Engine has no React in its
`dependencies`, so any attempt to `import 'react'` from inside
`@geaac/engine` fails at link time.

## Browser / runtime model

The browser sees one bundle. The package boundary is build-time,
not runtime.

### Development

```text
pnpm dev
  `-- vite in packages/sandbox
       `-- reads packages/engine/src/* via workspace symlink
       `-- serves transformed TS on http://localhost:5173
       `-- HMR per module, no rebuild
```

### Production

```text
pnpm build
  `-- vite build in packages/sandbox
       `-- bundles engine + sandbox into dist/assets/index-[hash].js
       `-- deploy dist/ to any static host
```

### Entry point

`packages/sandbox/src/main.tsx` is both the browser module entry point and the
composition root. It passes sandbox-owned configuration to the engine-owned
`createApplication` factory, then mounts the React UI with the resulting
application:

```text
browser loads main.tsx
  |-- createApplication({ name: "GEAAC Sandbox" })
  |     |-- sandbox owns application configuration
  |     `-- engine owns application construction
  `-- React renders the application UI
```

This preserves the architectural lesson from Hazel without copying its C++
linkage mechanism. Hazel needs the client to implement `CreateApplication` so
an engine-owned `main` can discover the concrete application at link time. In
the browser, `main.tsx` already owns module startup, so ordinary function
arguments make that dependency explicit.

For now, `createApplication` only converts configuration into an application.
A `run` function, launch and shutdown behavior, rendering, and events are
deferred until their corresponding lessons give those operations real work.

## Inside-package layout (engine)

The engine package organizes code by concern, not by feature. Early
modules live as flat files in `packages/engine/src/`. As the engine
grows, sub-folders appear when a concern has >= 3 modules:

```text
packages/engine/src/
  index.ts             barrel; re-exports the public API only
  platform/            (later) abstractions over host environment
  events/              (later) event bus + concrete events
  core/                (later) entity, component, system base types
```

Public API rule: only what `index.ts` re-exports is part of the
engine's contract. Everything else is internal and may change
without notice. Sandbox (and later editor) imports only from
`@geaac/engine`, never from internal paths.

## Decision log

### 2026-07-25 - Monorepo from day one

- **Decision**: pnpm workspaces with `packages/engine` and `packages/sandbox`.
- **Rationale**: faithful port of TheCherno's two-project Hazel setup;
  enforces import direction at the package boundary; cost is ~5
  lines of config; editor slots in later without restructuring.
- **Alternatives**: single Vite project with `src/engine` +
  `src/sandbox`; defer monorepo until editor arrives. Both teach
  ~80% of the same lesson but skip the package-boundary enforcement.

### 2026-07-25 - No engine build step

- **Decision**: engine ships as TS source; Vite reads it directly.
- **Rationale**: simpler iteration; no publish step. The package
  boundary is the protection, not the artifact.
- **Trade-off**: engine cannot be consumed as a built artifact by
  non-Vite tooling. Acceptable for now.

### 2026-07-25 - Three-doc split for project knowledge

- **Decision**: AGENTS.md / CONVENTIONS.md / ARCHITECTURE.md as
  separate docs with non-overlapping concerns.
- **Rationale**: each doc stays small and scannable; AI tools load
  the right doc at the right time; mirrors how real projects
  organize documentation.

### 2026-07-25 - Cross-tool command layout for AI agents

- **Decision**: canonical command prompts live in `.agents/commands/`;
  per-tool wrappers (`.claude/commands/`, `.codex/commands/`) each
  contain a thin pointer to the canonical file.
- **Rationale**: single source of truth for command logic; per-tool
  files register the slash command in each tool without duplicating
  the prompt. Adding a new tool means one 3-line file; changing
  behavior means editing one file.
- **Alternative**: duplicate the full prompt in each tool's directory.
  Rejected because drift between copies is inevitable.

### 2026-07-25 - Engine-owned application factory

- **Decision**: the engine exports `createApplication(config)`. The sandbox
  calls it with application-specific configuration from its `main.tsx` entry
  module.
- **Rationale**: the engine should own how an application is constructed while
  the client owns what it configures. Explicit arguments are the native
  TypeScript module mechanism for this boundary; a client-implemented factory
  would reproduce Hazel's C++ linker solution without its underlying need.
- **Naming**: use `Application`, `ApplicationConfig`, and `createApplication`.
  Avoid `Geaac` in symbol names because the `@geaac/engine` import already
  supplies that namespace. Use “config”, not “props”, because these are
  construction-time engine values rather than React render inputs.
- **Scope**: `Application` contains only identity and `createApplication` only
  constructs it. No `run` operation exists until there is lifecycle behavior
  to run.

## Open questions

- Renderer abstraction: WebGL only, or WebGPU too? Defer.
- ECS: write our own or use a library? Defer to scene episode.
- Asset pipeline: serialization format? Defer to asset episode.
- Editor package layout: where do editor-only helpers live? Defer.
