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
  Sandbox -->|workspace import + canvas| Engine[engine<br/>browser engine lib]
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
    |-- engine/                 TypeScript browser engine, no React
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

Role: TypeScript browser engine library. All reusable engine code lives here.

Constraints:

- No React in `dependencies` or `devDependencies`.
- Browser APIs enter through explicit host inputs or platform/backend modules;
  engine code does not discover host elements through ambient DOM queries.
- No imports from `@geaac/sandbox` or any future sibling package.

Why: the engine owns the browser runtime and graphics integration, while the
consumer owns its DOM layout and supplies the canvas on which the engine will
render. Explicit inputs keep API-neutral engine code testable in Node and the
engine reusable across browser consumers.

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
| engine  | web platform APIs, node stdlib, own modules        |
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

`packages/sandbox/src/App.tsx` is the engine composition root. The React
component renders the host canvas and calls `createApplication` in a mount
effect once the element is attached, so the engine can never run before its
rendering surface exists. `packages/sandbox/src/main.tsx` is the React
bootstrap only: find `#root`, render `<App />`.

```text
browser loads main.tsx
  |-- React renders <App /> into #root
  `-- <App /> mounts
        |-- <canvas ref={canvasRef} /> becomes the host surface
        `-- createApplication({ name: "GEAAC Sandbox", canvas })
              |-- sandbox owns application configuration and DOM placement
              `-- engine owns application construction and retains the canvas
  `-- React renders the application UI
```

This preserves the architectural lesson from Hazel without copying its C++
linkage mechanism. Hazel needs the client to implement `CreateApplication` so
an engine-owned `main` can discover the concrete application at link time. In
the browser, `App.tsx` owns the canvas mount lifecycle, so an effect that
reads the canvas ref and calls the factory is the natural expression of that
boundary.

For now, `createApplication` only retains application identity and the injected
canvas. It does not create a graphics context. A `run` function, launch and
shutdown behavior, rendering, and events are deferred until their corresponding
lessons give those operations real work.

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

### 2026-07-25 - Engine-owned application factory with injected canvas

- **Decision**: the engine exports `createApplication(config)`. The sandbox
  calls it from `App.tsx` with application-specific configuration and its host
  canvas.
- **Rationale**: the engine should own how an application is constructed while
  the client owns what it configures and where the canvas lives in the DOM. The
  engine receives the canvas because graphics context creation and rendering
  are engine responsibilities. Explicit arguments are the native TypeScript
  module mechanism for this boundary; a client-implemented factory would
  reproduce Hazel's C++ linker solution without its underlying need.
- **Naming**: use `Application`, `ApplicationConfig`, and `createApplication`.
  Avoid `Geaac` in symbol names because the `@geaac/engine` import already
  supplies that namespace. Use “config”, not “props”, because these are
  construction-time engine values rather than React render inputs.
- **Scope**: `Application` contains only identity and the injected canvas;
  `createApplication` does not initialize a graphics API. No `run` operation
  exists until there is lifecycle behavior to run.

## Open questions

- Renderer abstraction: WebGL only, or WebGPU too? Defer.
- ECS: write our own or use a library? Defer to scene episode.
- Asset pipeline: serialization format? Defer to asset episode.
- Editor package layout: where do editor-only helpers live? Defer.
