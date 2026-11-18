---
description: Kick off a Trello story - clone card, move clone to In Progress, save spec, create branch
---

Kick off Trello card `$ARGUMENTS` for WorkshopHub using Trello MCP tools (`trello-mcp`).

Card ID is `$ARGUMENTS` (e.g. `WH-2`) — this is the working card. If no argument is given, use the `Question` tool to ask for the card ID from the "To Do" column and stop until answered.

## Workflow

1. **Read board:**
   - Use `mcp__trello__trelloReadBoard` to list the boards available to the user, if no boards are available, stop.
   - Otherwise, even if there's only one, use `AskUserQuestion` to get the board to operate on.

2. **Read card:**
   - If no arguments are present, use `mcp__trello__trelloReadList` to list the cards in the To Do column. Use `AskUserQuestion` so the user can choose which card to operate on.
   - Use `mcp__trello__trelloReadCard` to read the card content for the given card ID/key (either the card chosen in the previous step, or the card id in `$ARGUMENTS`).
   - Show title, status/column, description, and acceptance criteria to the user.

3. **Check the card:**
   - If the card is NOT in "To Do": Surface a message that the card is not in the correct state. and STOP
   - If the card has one or more members that aren't the current user: Surface a message that the card has been claimed by someone else and STOP.
   - Confirm the card ID by showing it to the user and stop until the user confirms.

4. **Update the card:**
   - Use `mcp__trello__trelloWriteCard` to update the card to the "In Progress" column, and to update the card member to the current calling Trello user.

5. **Clarify:**
   - Use the `AskUserQuestion` tool for clarifications (scope, acceptance criteria, approach) before creating files/branch. Do not assume ambiguous requirements.

6. **Save story:**
   - Save the card description as a markdown file in `./stories`, named `wh-{card-id}-{title}.md` (lowercase, hyphen-slug, e.g. `./stories/wh-2-session-registration.md`), using the card's ID and title.
   - Include in the file body: Card ID, title, status, original card ID as source link/ID, summary, acceptance criteria, clarifications/notes.
   - Create `./stories` if it does not exist.

7. **Create branch and stop:**
   - Create and checkout branch `wh-{card-id}-{desc}` from `main` matching the story file slug, e.g.:
     ```sh
     git checkout -b wh-2-session-registration
     ```
   - Confirm the branch name with `git branch --show-current` and show it to the user.
   - Stop. Do not plan, implement, commit, or push.
