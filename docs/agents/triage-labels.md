# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's GitHub issue tracker (`guibranco/finance-ops`).

The repo already had a label vocabulary before the skills were set up, so three roles reuse existing labels (emoji included — the emoji is part of the label string) and two were created for the agent workflow.

| Label in mattpocock/skills | Label in our tracker  | Meaning                                  |
| -------------------------- | --------------------- | ---------------------------------------- |
| `needs-triage`             | `🚦 awaiting triage`  | Maintainer needs to evaluate this issue  |
| `needs-info`               | `⏳ waiting response` | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`     | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`     | Requires human implementation            |
| `wontfix`                  | `wontfix`             | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table. Pass the full string, emoji and all, to `gh issue edit --add-label "..."`.

Edit the right-hand column to match whatever vocabulary you actually use.
