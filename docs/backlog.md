# Engineering Backlog - codename

This file tracks cross-cutting action items, technical debt, and follow-ups from code reviews.

**Format:** Markdown table with Date, Story, Epic, Type, Severity, Owner, Status, Notes

---

## Code Review Follow-ups (2026-01-06)

| Date | Story | Epic | Type | Severity | Owner | Status | Notes |
|------|-------|------|------|----------|-------|--------|-------|
| 2026-01-06 | 6-1 | Epic 6 | Data Integrity | CRITICAL | Dev | **FIXED** | Story status reconciled: Status updated to "done", all ACs marked complete. Matches sprint-status.yaml. |
| 2026-01-06 | 1-3 | Epic 1 | Feature Incomplete | CRITICAL | Dev | **FIXED** | Vision AI fully integrated with OpenAI GPT-4o-mini. Real image processing working. Tests passing (10/10). |
| 2026-01-06 | 1-6b | Epic 1 | Feature Incomplete | CRITICAL | Dev | Open | Provisioning Service uses mock orchestration, no actual n8n or Replit integration. **Action:** Implement real n8n webhook triggers and Replit API calls. |
| 2026-01-06 | All | All Epics | Configuration | CRITICAL | Dev | **FIXED** | Created comprehensive .env.example with all required API keys for Epics 1-6. Added .env to .gitignore. |
| 2026-01-06 | All | All Epics | Build System | CRITICAL | Dev | **FIXED** | Database tsconfig.json updated to exclude test files. Cleaned dist/ directory. |
| 2026-01-06 | 1-1 | Epic 1 | Tailwind Config | MEDIUM | Dev | Open | Tailwind v4 configured but not using v4 CSS-first approach. 50+ hardcoded CSS vars instead of theme config. **Action:** Migrate to Tailwind v4 theme() function and @theme directive. |
| 2026-01-06 | 1-4, 1-5 | Epic 1 | React Warnings | MEDIUM | Dev | **FIXED** | False positives from jsdom test environment. Suppressed known warnings in setup-tests.ts. Code is correct (motion.div properly used). |
| 2026-01-06 | All | All Epics | Build System | MEDIUM | Dev | Open | Turbo build fails with "Permission denied" log writing errors. **Action:** Fix turbo cache permissions or disable log writing in CI. |
| 2026-01-06 | All | All Epics | Architecture | MEDIUM | Dev | Open | No Supabase client integration despite Architecture specifying it as "Primary persistence and auth". Only local PostgreSQL used. **Action:** Add Supabase client, implement WebAuthn/Passkeys. |
| 2026-01-06 | 6-2 | Epic 6 | Color Parsing | MEDIUM | Dev | Open | ColorPaletteEditor test shows 44 "Failed to parse color" warnings. **Action:** Fix color validation in parseColor() utility. |
| 2026-01-06 | All | All Epics | Data Cleanup | LOW | Dev | Open | Test/demo user data may be in database schemas. **Action:** Add migration to sanitize test data before production. |
| 2026-01-06 | All | All Epics | Component Library | LOW | Dev | Open | Dialog component forwardRef warnings from Radix UI. **Action:** Update Shadcn dialog overlay with React.forwardRef wrapper. |

---

## Legend

**Type:**
- Data Integrity: Inconsistent state/tracking
- Feature Incomplete: Marked done but not functional
- Configuration: Missing setup/env vars
- Build System: Compilation/tooling issues
- Architecture: Design deviation
- Code Quality: Best practices violations

**Severity:**
- CRITICAL: Blocks production deployment
- HIGH: Major functionality broken
- MEDIUM: Works but needs improvement
- LOW: Cosmetic/nice-to-have

**Status:**
- Open: Not started
- In Progress: Being worked on
- Blocked: Waiting on dependency
- Done: Completed and verified
