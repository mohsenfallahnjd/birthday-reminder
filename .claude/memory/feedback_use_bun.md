---
name: feedback-use-bun
description: Always use bun instead of npm for running scripts and commands
metadata:
  type: feedback
---

Always use `bun` (not `npm`) for running scripts and commands in this project.

**Why:** User preference — they use bun as the package manager/runtime.
**How to apply:** Replace `npm run <script>` with `bun run <script>`, `npx` with `bunx`, etc.
