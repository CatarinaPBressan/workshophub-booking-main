# WH-3: Waitlist when a training session is full

## Story metadata

| Field | Value |
| --- | --- |
| Clone card ID | `6afc5a3786ec6ae0d591e698` |
| Clone card ARI | `ari:cloud:trello::card/workspace/6afc5a14ad94aeddbdff5b12/6afc5a3786ec6ae0d591e698` |
| Clone card URL | https://trello.com/c/f8boASDU/7-wh-3-waitlist-when-a-training-session-is-full |
| Title | WH-3: Waitlist when a training session is full |
| Status / column | In Progress |
| Original (source) card ID | WH-3 |
| Source card URL | https://trello.com/c/f8boASDU/7-wh-3-waitlist-when-a-training-session-is-full |
| Source board | WorkshopHub - Catarina |
| Type / Priority | Story / trainee exercise |
| Branch | `wh-3-waitlist-when-a-training-session-is-full` |

> The original card `WH-3` is read-only and must never be modified (no status change, comment, or edit).

## Summary

After WH-2 is implemented, a session can fill up. When a session reaches capacity,
subsequent employees who want to attend should be placed on a waitlist rather than being
turned away. This ensures demand is captured and can be fulfilled if a registered employee
cancels (WH-4 → WH-5).

As an employee, I want to join a waitlist for a full training session so that I can attend
if a place becomes available.

When a session is full, an employee can join the waitlist. The system records their position
and informs them they are waitlisted, not confirmed.

This is a **trainee exercise story**. It is not implemented in the baseline template.

## Acceptance Criteria

- When `registered >= capacity`, new registrations are added to the waitlist
- The waitlisted employee sees a message confirming they are waitlisted (not confirmed)
- The session card shows a "Join Waitlist" option when the session is full
- `POST /api/training-sessions/:id/registrations` returns HTTP 202 with
  `{ status: "waitlisted", position: N }` when full
- Waitlisted registrations have status `waitlisted` in the database
- Confirmed registrations have status `confirmed`

## Out of Scope

- Promotion from waitlist (WH-5)
- Cancellation (WH-4)
- Email notification (WH-8)
- Maximum waitlist size

## Suggested Tests

- `POST` when session is full → 202 with `status: "waitlisted"`
- `POST` when session has space → 201 with `status: "confirmed"`
- Waitlisted count is tracked separately from registered count
- Position in waitlist is correct (1st, 2nd, etc.)

## Data Model Hint

The `Registration` model should include a `status` field: `confirmed | waitlisted | cancelled`.

## Clarifications / Notes

- Depends on WH-2 (registration with `registered` count increment) being implemented first.
- The `Registration.status` field requires a Prisma schema change (`confirmed | waitlisted | cancelled`),
  applied with `prisma db push`, keeping the seed working.
- Backend: `POST /api/training-sessions/:id/registrations` must branch on `registered >= capacity`:
  when full, create a `waitlisted` registration and return 202 with `position`; when space remains,
  create a `confirmed` registration and return 201.
- Position in waitlist is the count of existing waitlisted registrations for that session + 1.
- UI: the session card shows a "Join Waitlist" option when the session is full.

## Repo touch points (for implementation)

- `api/prisma/schema.prisma` — add `status` field to `Registration` model (`confirmed | waitlisted | cancelled`).
- `api/src/services/trainingSessionService.ts` — registration service with capacity/waitlist branching.
- `api/src/routes/training-sessions.ts` — `POST /:id/registrations` endpoint; map service result to 201/202.
- `api/tests/integration/training-sessions.test.ts` — integration tests for 201/202 and position tracking.
- `app/src/components/TrainingSessionCard.tsx` — "Join Waitlist" option when session is full.
