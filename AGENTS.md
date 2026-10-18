# Session wrap-up

For each completed implementation session in this repository, push the session
branch, open or update its pull request, and reconcile the issues addressed by
that session. This is the default workflow unless the user asks to skip a step.

- Keep session changes on a `codex/` task branch. Check `git status` before
committing; include only changes for the current task and leave unrelated user
changes untouched. Commit task changes, then push the branch.
- Open one PR for the branch, or update its existing PR. For stacked work, target
the immediate predecessor branch. Keep the PR draft while review is pending;
never merge or deploy unless the user explicitly asks.
- Close an issue only after its full Definition of Done is met and the PR,
verification, and limitations are recorded in the issue. Keep incomplete issues
open and state their remaining work.
- Before ending the session, verify the remote branch, PR state and CI results,
issue states, and a clean working tree. Record the result and any blocker in the
session handoff.
