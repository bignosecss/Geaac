# sync-progress

Sync the project's documentation (AGENTS.md, ARCHITECTURE.md, CONVENTIONS.md)
with the actual state of the codebase after a slice of work is complete.

## When to invoke

After finishing a logical slice of work — a new engine module, a package
scaffold, an architectural decision implemented, or any change that makes the
docs stale. Not after every commit; only after milestone-level progress.

## What this command does

1. Discovers what changed since the last docs sync
2. Identifies which `.md` files have stale content
3. Proposes specific edits
4. Shows you the diff and asks for confirmation
5. Commits the docs changes (only if confirmed)

## Step-by-step instructions

You are a coding agent. Follow these steps in order. Do not skip steps.
Do not commit without explicit user confirmation.

---

### Step 1 — Find the baseline

Run:

```
git log --oneline -1 -- AGENTS.md ARCHITECTURE.md CONVENTIONS.md
```

This gives you the last commit that touched project documentation. Everything
after this commit is "new progress" not yet reflected in the docs.

If the command returns nothing (no prior docs commit), treat the initial
commit as the baseline — use:

```
git log --oneline -1
```

Record the baseline commit hash and subject.

---

### Step 2 — Discover what changed

#### 2a. Changed files

Run:

```
git diff --stat <baseline>..HEAD -- packages/
```

This shows which packages and files were added, modified, or deleted.

#### 2b. New modules in engine

List directories and files under `packages/engine/src/` (excluding
`node_modules/`). For each module, note:
- Does it have a source file?
- Does it have a test file?
- Is it re-exported from `index.ts` (the barrel)?
- Is it a new concern (new subdirectory with >= 2 files)?

#### 2c. New dependencies or tooling

Check `packages/*/package.json` for new dependencies, scripts, or config
changes compared to baseline.

#### 2d. Tests added

Count new `*.test.ts` or `*.test.tsx` files in the diff. Note coverage gaps
(modules without tests).

---

### Step 3 — Read current docs

Read these three files in full:

- `AGENTS.md`
- `ARCHITECTURE.md`
- `CONVENTIONS.md`

Compare what they say against what Step 2 discovered.

---

### Step 4 — Identify staleness

Check each doc for these categories of drift:

#### ARCHITECTURE.md

- **Status fields**: each package section has a `Status:` line. Does it match
  reality? (e.g. "scaffolding today" → should say "scaffolded" if scaffolding
  is done)
- **Decision log**: any architectural decisions made in this diff that
  deserve a dated entry? Format matches existing entries.
- **Package descriptions**: any new constraints, new features, or new
  internal modules that should be mentioned?
- **Layout diagrams**: does the ASCII file tree in "Inside-package layout"
  still match the actual directory structure?

#### AGENTS.md

- **Stack**: any new tooling added? New libraries?
- **Engine architecture scope**: if a listed item was completed, is it
  reflected anywhere? (AGENTS.md may not track granular progress — only
  update if the scope list itself changed.)
- **Working principles**: any new principles discovered during this slice?

#### CONVENTIONS.md

- **New patterns**: did this diff introduce a new coding pattern (new naming
  convention, new file layout rule, new import pattern) that should be
  documented?
- **Scope clarifications**: did any existing convention get refined?

#### General checks

- Is anything mentioned in the docs that no longer exists in the codebase?
- Is anything in the codebase not mentioned in the docs that should be?
- Are "planned" or "today" markers still accurate?

---

### Step 5 — Plan the edits

For each staleness you found, write down:
- Which file to edit
- What exact text to replace
- What new text should say

Prefer minimal edits. Do not rewrite sections that are still accurate.
Do not add a progress tracker or checklist unless one already exists in
that file — this command syncs existing doc fields, it does not introduce
new doc structure.

If nothing is stale, report: "Docs are up to date. Nothing to sync."
and stop here.

---

### Step 6 — Present the diff

Show the user a summary of each proposed edit:

```
File: ARCHITECTURE.md
  Line ~71: "Status: scaffolding today" → "Status: scaffolded (barrel, version)"
  (Include the actual old_string / new_string you plan to use.)
```

After the summary, ask:

> Apply these changes? (yes / no / edit)

Do NOT proceed to Step 7 unless the user explicitly confirms with "yes" or
equivalent.

If the user says "edit" or provides changes, incorporate their feedback and
re-present.

If the user says "no", stop.

---

### Step 7 — Apply the edits

For each confirmed edit, use the editing tool available in your environment
to replace the text in the target file.

After all edits are applied, re-read each changed file to verify the edits
landed correctly.

---

### Step 8 — Commit

Run:

```
git add AGENTS.md ARCHITECTURE.md CONVENTIONS.md
git commit -m "docs: sync progress

<Describe what changed in the docs and why, 2-3 lines max.
Example: Update engine and sandbox status from scaffolding to
scaffolded. Add decision log entry for cross-tool skill layout.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

Use the Conventional Commits format. The scope is the doc or area updated.
The body explains why the docs changed (what progress was made).

If only one of the three files changed, only `git add` that file.
If none of the three standard docs changed but a new doc was added, add that
file instead.

---

### Step 9 — Report

Print a one-line summary of what was committed:

> docs: sync progress after <describe the slice>

---

## Guardrails

- **Never commit without confirmation.** Steps 6→7 is gated on explicit
  user "yes."
- **Never invent progress.** Only update docs to reflect code that actually
  exists in the working tree.
- **Never restructure docs.** This command patches existing fields; it does
  not add new sections, reorganize files, or change the doc format.
- **One commit.** All doc updates go in a single `docs:` commit. Do not
  split across multiple commits.
- **If nothing is stale, say so.** Don't force an edit just to have
  something to commit.
