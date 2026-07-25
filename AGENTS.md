# GEAAC - Project Memory

## Mission
Gain Experience in Application Architecture and Complexity (GEAAC).
Primary purpose: software design - how to manage complexity in large
TypeScript applications. The deliverable is the learning itself; a working
artifact is secondary.

## Method
Follow TheCherno's "Game Engine" YouTube series, ported from C++/Hazel
to the web platform. Re-create the architectural lessons in TypeScript
rather than copying code 1:1.

## Stack
- Language: TypeScript (primary), JavaScript tolerated only where unavoidable
- UI: React + Tailwind + shadcn/ui
- State: Zustand (default), React state only when trivial
- Build: Vite, ESLint, Prettier
- Package manager: pnpm (use `pnpm <cmd>`; never `npm`, `yarn`, or `bun`)
- Testing: Vitest + @testing-library/react; Playwright later if browser-level E2E is needed
- No heavy frameworks (Next.js, etc.) unless they earn their place

## Engine architecture scope (port from Hazel)
Windowing, event bus, input, logging, 2D renderer (batched), ImGui-style
editor, ECS, 3D renderer, materials, lighting, scene/asset pipeline,
physics, audio, scripting. Build in small slices, each slice a learning
milestone.

## AI workflow (secondary learning goal)
Tools in active use: Codex and Claude Code. Practice using AI
for: architecture review, design proposals, code generation, refactoring,
test generation, and code review. Prefer small, reviewable diffs over
large rewrites. AI should propose; the human decides.

## Working principles
- Complexity is the enemy - name it before adding to it
- Prefer composition over inheritance; data over behavior where possible
- Read code more than write code; refactor as understanding grows
- No copy-pasted "tutorial" code - port the idea, write the implementation
- Tests are part of the architecture, not an afterthought
- Commit early, commit often, with messages that explain *why*

## Conventions
See [CONVENTIONS.md](./CONVENTIONS.md) for the commit-message format and
code conventions (naming, imports, React, engine, testing, file layout).
AI tools MUST read and follow it when proposing commits or edits.

## Architecture
See [ARCHITECTURE.md](./ARCHITECTURE.md) for the system shape, package
boundaries, dependency rules, browser/runtime model, and decision log.
AI tools MUST consult it before designing new modules, proposing
structural changes, or modifying the package boundary.

## Update cadence
This file is a living document. Whenever preferences, scope, or principles
change, edit it. New sessions of Codex/Claude Code will read the latest
version on load.
