# CLAUDE.md — Instructions for Claude Code

Read automatically by Claude Code. OpenCode has already built the full app — foundation,
AI integration, frontend, UI polish, edge cases, and deployment (Phases 1–6 in `task.md`).
Your job is a **final review and enhancement pass**, not a rebuild.

## First step, always
Audit the actual repo against `task.md` and `PROMPT_DESIGN.md`. Don't trust checkboxes
blindly — verify each phase is genuinely working by reading the code and, where possible,
running it. Report back honestly what's solid, what's shaky, and what's missing before
changing anything.

## Project
**StadiumPilot** — AI concierge for stadium fans (navigation + multilingual + accessibility).
Full scope in `task.md`, AI agent design + system prompt + JSON contract in
`PROMPT_DESIGN.md`.

## Your scope: enhancement pass, not new features
1. **Correctness check** — does every "AI" response actually come from a real Gemini API
   call? Flag and fix anywhere a response is hard-coded, templated, or faked.
2. **Security check** — confirm the API key is server-side only, never shipped to the
   client, and not committed anywhere in the repo.
3. **Edge case verification** — re-test every case in `PROMPT_DESIGN.md` section 5. Fix any
   that don't behave as specified. Don't skip this even if OpenCode marked it done.
4. **Code quality pass** — clean up inefficiencies, remove dead code, improve structure
   where it clearly helps (don't do a purely cosmetic rewrite of working code).
5. **UI polish pass** — check for any remaining overlaps, inconsistent spacing, or unclear
   hierarchy that slipped through. Take a screenshot before and after your changes.
6. **Docs pass** — fill in the remaining blanks in `README.md` (tech stack, how to run,
   live link) and make sure `task.md`'s status checklist matches reality.

## Rules
- Don't rebuild anything that's already working correctly just because you'd have done it
  differently — this is refinement, not a rewrite.
- Follow the JSON contract in `PROMPT_DESIGN.md` exactly. If you must change it, update the
  doc in the same change.
- Don't add personas, verticals, or features beyond what's scoped in `task.md`.
- Ask before installing any new dependency.

## How to run
_(confirm/update based on what OpenCode actually built)_

## How to test
_(confirm/update based on what OpenCode actually built)_
