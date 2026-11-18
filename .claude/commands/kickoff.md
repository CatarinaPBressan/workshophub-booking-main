---
description: Kick off a Trello card - move card to In Progress, save spec, create branch
---

Kick off a Trello card for the project WorkshopHub using Trello MCP tools (`trello-mcp`). Ensure that the Trello tools are loaded, and assume that the trello tools are under the `mcp__trello__` namespace

## Workflow

1. **Read board:**
   - Use `trelloReadBoard` to list the boards available to the user, if no boards are available, stop.
   - If there is only one board, confirm the board to operate on.
   - Otherwise, ask the user to get the board to operate on.

2. **Read card:**
   - Use `trelloReadList` to list the cards in the To Do column. List the id and title of each card and ask the user to pick one.
   - Use `trelloReadCard` to read the card content for the given card ID/key (either the card chosen in the previous step, or the card id in `$ARGUMENTS`).
   - Show title, status/column, description, and acceptance criteria to the user.

3. **Check the card:**
   - If the card is NOT in "To Do": Surface a message that the card is not in the correct state. and STOP
   - If the card has one or more members that aren't the current user: Surface a message that the card has been claimed by someone else and STOP.
   - Confirm the card by showing the contents to the user and stop until the user confirms. The intent here is for the user to double-check their picked card before starting work.

4. **Update the card:**
   - Use `trelloWriteCard` to update the card to the "In Progress" column, and to update the card member to the current calling Trello user.

5. **Clarify:**
   - Use the `AskUserQuestion` tool for clarifications (scope, acceptance criteria, approach) before creating files/branch. Do not assume ambiguous requirements.

6. **Save story:**
   - Save the card description as a markdown file in `./stories`, named `wh-{card-id}-{title}.md` (lowercase, hyphen-slug, for example: `./stories/wh-2-session-registration.md`), using the card's ID and title.
   - Include in the file body: Card ID, title, status, original card ID as source link/ID, summary, acceptance criteria, clarifications/notes.
   - Create `./stories` if it does not exist.

7. **Create branch and stop:**
   - Create and checkout branch `wh-{card-id}-{desc}` from `main` matching the story file slug, for example:
     ```sh
     git checkout -b wh-2-session-registration
     ```
   - Confirm the branch name with `git branch --show-current` and show it to the user.
   - Stop. Do not plan, implement, commit, or push.
