---
name: design-button-hierarchy
description: Create clear primary/secondary/tertiary action distinctions
domain: ui-design
skill-type: generative
version: 1.0.0
author: refactoring-ui-expert
prerequisites: []
dependencies:
  - 03-build-color-palette
---

# Skill: Design Button Hierarchy

## Purpose
Create clear distinctions between primary, secondary, and tertiary actions so users know which action to take.

## Input
- List of actions/buttons needed
- Relative importance of each action (primary, secondary, tertiary)
- Context (form, modal, page, toolbar)

## Output
- Button style specifications for each level
- Pass/Fail assessment of existing button hierarchy

## Decision Criteria

### PASS (Good Button Hierarchy)
- **One clear primary action** per screen/section (filled, high contrast, brand color)
- **Secondary actions** visually subordinate (outlined, ghost, or lower contrast solid including grey)
- **Tertiary actions** minimal (text link or subtle)
- Clear visual distinction between levels (not subtle 10% differences)
- Destructive actions (delete) use red but don't compete with primary

### FAIL (Poor Button Hierarchy)
- Multiple buttons with equal visual weight
- Primary action not obvious
- Very light grey (200) secondary looks disabled
- Destructive actions draw more attention than primary
- All buttons filled with same color

## Button Style Patterns

| Level | Background | Border | Text | Use Case |
|-------|------------|--------|------|----------|
| **Primary** | Brand color (solid) | None | White/light | Main CTA, save, submit |
| **Secondary** | Grey (solid) or transparent | Brand color (if outline) | Brand color or grey | Alternative action, cancel |
| **Tertiary** | Transparent | None | Brand color or gray | Optional actions, learn more |
| **Destructive** | Red | None | White | Delete, remove (not competing) |
| **Disabled** | Gray 200 | None | Gray 400 | Cannot proceed |

## Common Failure Modes

| Failure | Description | Fix |
|---------|-------------|-----|
| **Button Battle** | Save and Cancel both filled brand | Make Cancel outline or grey solid |
| **Gray Button Confusion** | Very light grey (200) secondary looks disabled | Use grey 400-500 or outline |
| **Red Alert** | Delete button more prominent than primary | Make delete text-only or smaller |
| **Primary Overload** | 3+ "primary" buttons | Choose one primary, demote others |
