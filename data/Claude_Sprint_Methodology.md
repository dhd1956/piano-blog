Sprint Transition Strategy

1. Update claude.md at Sprint Boundaries

After Sprint 1 completion: Update your claude.md to reflect what was actually built (not what was planned)
Document any architectural decisions or deviations from the original plan
Remove outdated information and add lessons learned

2. Provide Sprint Context Explicitly
   When starting work on Sprint 2 tasks, give Claude Code:
   "We've completed Sprint 1. Here's what we built: [brief summary]
   Now working on Sprint 2. Current task: [Jira ticket ID and description]
   Here are the acceptance criteria: [list them]"

```

### 3. **Incremental Reviews**
- **Don't let Claude Code run too long autonomously** - check in every 10-15 minutes
- Review code changes before they pile up
- Ask Claude Code to explain its approach before implementing large features
- Use prompts like: "Before you implement this, explain your approach and wait for my approval"

### 4. **Use Checkpoints**
After each substantial change:
- Review the diff
- Test the functionality
- Confirm it matches acceptance criteria before moving to the next task

### 5. **Maintain a Working Session Document**
Keep a simple log of:
- What Claude Code has completed today
- Current blockers or questions
- Decisions you've made during the session

## Example Interaction Flow
```

You: "We're in Sprint 2. Working on [JIRA-123]: Add user authentication.
Before you start, review the current auth setup and propose your approach."

[Claude explains approach]

You: "Approved. Proceed with step 1 (setup auth provider).
Stop after that's complete so I can review."

[Claude implements, you review]

You: "Looks good. Continue with step 2..."
Red Flags to Watch For

Claude Code making assumptions about requirements → stop and clarify
Large refactors without explicit approval → roll back and discuss
Deviating from Sprint 2 scope → redirect focus
Not following your project's established patterns → provide examples

The key is short feedback loops rather than letting Claude Code complete entire features autonomously. You remain the architect and decision-maker; Claude Code is the implementation partner.RetryClaude can make mistakes. Please double-check responses. Sonnet 4.5
