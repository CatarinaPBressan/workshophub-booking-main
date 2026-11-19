---
description: Kick off a Trello card - move card to In Progress, save spec, create branch
---

Kick off a Trello card for the project WorkshopHub using Trello MCP tools (`trello-mcp`). Ensure that the Trello tools are loaded, and assume that the trello tools are under the `mcp__trello__` namespace

## Workflow

1. **Read board:**
   - The project board is pinned to **WorkshopHub - Catarina** (https://trello.com/b/6saD6hC2/workshophub-catarina). Operate on this board directly; do not list boards or ask the user to choose one.
   - If the board cannot be read (e.g. archived or missing), stop.

2. **Summarize card:**
   - Read the To Do list on the board with `trelloReadList` (action `get`, the list named "To Do") to get its cards (id + title).
   - For each card, read the full card with `trelloReadCard`. A card is unclaimed when its `members` field is empty (`members: []`); skip any card that has members (it is claimed by someone else).
   - List the unclaimed cards (id and title) and ask the user to pick one.
   - Use `trelloReadCard` to read the full card content for the selected card ID/key, and show the user the title, status/column, description, and acceptance criteria.

3. **Confirm the picked card:**
   - Show the user the picked card's contents (title, status/column, description, acceptance criteria).
   - Ask the user to confirm with `AskUserQuestion`: one Yes/No question — "Yes, proceed with this card" / "No, stop".
   - If the user answers "No", stop at this step. If "Yes", continue to Step 4.

4. **Update the card:**
   - Look up the current calling Trello user with `trelloReadMember` (action `get_me`) to get their member ARI and full name.
   - Use `trelloWriteCard` (action `move`) to move the card to the "IN PROGRESS" column. The destination listId is the "IN PROGRESS" list on this board: `ari:cloud:trello::list/workspace/6afc5a14ad94aeddbdff5b12/6afc5a3786ec6ae0d591e668`.
   - Assign the card to the current user by passing their member ARI as `memberId`. Note: the `trelloWriteCard` schema labels `memberId` as being for an "add_member" action that doesn't exist, so if assigning the member fails on `move`, retry the assignment with action `update` (cardId + memberId).

5. **Clarify:**
   - Use the `AskUserQuestion` tool for clarifications (scope, acceptance criteria, approach) before creating files/branch. Do not assume ambiguous requirements.

6. **Save story:**
   - Save the card description as a markdown file in `./stories` (relative to the project root), named `wh-{card-id}-{title}.md` (lowercase, hyphen-slug, for example: `./stories/wh-2-session-registration.md`), using the card's ID and title.
   - Include in the file body: Card ID, title, status, original card ID as source link/ID, summary, acceptance criteria, clarifications/notes.
   - The source link/ID is the Trello card URL from `trelloReadCard` (the card's `url` field), e.g. `https://trello.com/c/f8boASDU/7-wh-3-waitlist-when-a-training-session-is-full`.
   - Create `./stories` if it does not exist.

7. **Create branch and stop:**
   - Ensure you are on `main`: run `git checkout main` (run `git fetch` first if you want the latest `main`).
   - Create and checkout branch `wh-{card-id}-{slug}` where `{slug}` is the lowercase, hyphen-slugged card title — the same slug used in the story filename from Step 6 (`wh-{card-id}-{title}.md`). Example:
     ```sh
     git checkout -b wh-2-session-registration
     ```
   - Confirm the branch name with `git branch --show-current` and show it to the user.
   - Stop. Do not plan, implement, commit, or push.
