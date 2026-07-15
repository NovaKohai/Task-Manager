---
name: design-empty-states
description: Create helpful, actionable zero-content states
domain: ui-design
skill-type: generative
version: 1.0.0
author: refactoring-ui-expert
dependencies:
  - 05-design-button-hierarchy
---

# Skill: Design Empty States

## Purpose
Create helpful, actionable empty/zero states that guide users forward instead of leaving them at a dead end.

## Input
- Context (what would be here normally)
- User state (first-time vs. cleared content)
- Available actions (what can the user do)

## Output
- Empty state design specification
- Copy recommendations
- Primary action to highlight

## Decision Criteria

### PASS (Good Empty State)
- Explains what would be here (sets expectation)
- Tells user how to add content (clear instruction)
- Provides clear primary action button
- Uses appropriate illustration/icon (not generic)
- Friendly, helpful tone (not "No items found")
- Hides useless UI (tabs, filters that don't work without content)

### FAIL (Poor Empty State)
- Blank screen or just "No data"
- Technical error message as empty state
- No guidance on what to do next
- Generic illustration unrelated to context
- Dead end with no actions

## Empty State Components

1. **Illustration/Icon** (optional but helpful)
2. **Headline** - Friendly, explanatory (not "Empty" or "No items")
3. **Description** - Brief explanation + how to add content
4. **Primary Action** - Clear CTA button
5. **Secondary Info** (optional) - Learn more link, import option

## Types of Empty States

| Type | Context | Approach |
|------|---------|----------|
| **First-time** | New user, no content | Onboarding, education, clear CTA |
| **User-cleared** | User deleted everything | Confirmation, undo option, re-add CTA |
| **No results** | Search/filter returned nothing | Adjust filters, clear search, try different terms |

## Common Failure Modes

| Failure | Description | Fix |
|---------|-------------|-----|
| **The Void** | Blank white space | Add context, illustration, CTA |
| **Error as Empty** | "404" or "Null" message | Distinguish error states from empty states |
| **No Way Forward** | Message but no action | Always provide primary CTA |
| **Negative Framing** | "You have no friends" | Positive framing: "Connect with people" |
