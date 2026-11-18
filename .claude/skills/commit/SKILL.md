---
name: commit
description: Create a single local commit on the current WorkshopHub branch as a Jira-prefixed Conventional Commit (e.g. `WH-2 feat: ...`). Refuses on main, scans for secrets, stages only the relevant files, confirms the message with the user, and never pushes or bypasses hooks. Use when the user asks to commit, "commit my changes", or "make a commit".
---

# Commit

Produce exactly one local commit on the current branch, then stop. This skill does
**not** push, open a PR, or run `make build`. A `git commit` is an ASK-FIRST action in
this repo, so the user must approve the exact message before anything is written.

Follow the steps in order. Any hard gate (below) is a full stop — explain why and do not
continue.

## 0. Hard gates (check before anything else)

- **Refuse on a protected branch.** Run `git branch --show-current`. If it is `main`
  (or `master`), stop: "I won't commit on `main`. Create a `wh-<thing>-<thing>` branch
  first, then commit there." Do not commit.
- **No hook bypass.** Never pass `--no-verify` (or any flag that skips the pre-commit
  hook). The hook enforces branch naming and a REASONS lint over `spdd/prompt/*.md`. If it
  fails, fix the underlying cause — never disable it.
- **Never commit secrets.** Do not stage or commit secret-bearing files. These are
  gitignored by `.gitignore`, so staging one requires `git add -f`, which is a red flag:
  abort and ask. Names to treat as secrets:
  `.env`, `.env.*`, `.env.local`, `.env.production`, `*.sqlite`, `*.sqlite-*`,
  `*credentials*`, `*secret*`, `*.pem`, `*.key`, `id_rsa`, `*.p12`. (`.env.example` is the
  only committed env file — it is fine.)
- **No bulk staging by default.** Do not run `git add -A` / `git add .` / `git add -u` to
  satisfy a commit. Stage the specific files that belong to this change; `-A` is allowed
  only if the user explicitly confirms the full set.

## 1. Inspect the working tree

Show the user a *short* summary, not a raw diff dump:

- `git status --short` — what changed and what is untracked.
- `git diff --staged --stat` — files already staged.
- `git diff --stat` — files staged-but-not / unstaged.

If there is nothing to commit, stop: "Nothing to commit — working tree is clean."

## 2. Derive the Jira ticket (`WH-<n>`)

The commit message must carry a Jira prefix. Resolve `WH-<n>` in this order, and stop at
the first hit:

1. A `WH-\d+` token (case-insensitive) in the current branch name
   (`git branch --show-current`). e.g. `wh-WH-2-capacity-gate` → `WH-2`.
2. If the branch has none, a `WH-\d+` token in the last few commit subjects
   (`git log -n 5 --format=%s`) or in sibling branch names (`git branch`).
3. If no ticket is discoverable, **ask the user** which Jira issue this is (use
   AskUserQuestion, or ask in chat). Do not guess a number.

## 3. Stage the relevant files

Stage only the files that are part of this change, naming them explicitly:

```
git add path/to/a.ts path/to/b.ts
```

After staging, re-check the staged set (`git diff --staged --name-only`) against the
secret list in step 0. If a secret slipped in, unstage it and ask.

> Optional pre-check (skip if the user asks): for code changes, the repo norm is that
> `make test` and `make lint` pass. You may suggest running them, but a green gate is not
> required to proceed — the user decides. Never use a failing gate as a reason to add
> `--no-verify`.

## 4. Propose a message and get confirmation

Suggest one Conventional Commit line, Jira-prefixed:

```
WH-<n> <type>: <short summary in imperative mood>
```

`<type>` ∈ `feat | fix | docs | chore | test | refactor | style | perf` (optional
`scope` allowed, e.g. `WH-2 feat(api): add capacity-safe registration`).
Add a second `-m` for a body only when it adds context.

Present the exact message (and the final file list) and get explicit approval —
AskUserQuestion with **Approve / Edit / Cancel**, or a plain yes/no in chat. If the user
edits, revise and re-confirm. Do not commit until the exact message is approved.

## 5. Commit, then stop

Run the commit with the approved message:

```
git commit -m "WH-<n> <type>: <summary>"
```

(append a second `-m "body"` if one was approved). No `--no-verify`.

When it succeeds, report the new commit hash + subject and then **stop**. Do **not** push,
and do **not** open a PR. State plainly that the commit is local and unpushed; offer to
push or open a PR only if the user asks.

If the commit fails (e.g. the pre-commit hook rejects it), do **not** retry with
`--no-verify`. Surface the hook output, fix the cause, and re-commit only after the user
re-approves.
