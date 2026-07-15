---
name: manage-color-contrast
description: Ensure WCAG AA accessibility and readability
domain: ui-design
skill-type: evaluative
version: 1.0.0
author: refactoring-ui-expert
dependencies:
  - 03-build-color-palette
---

# Skill: Manage Color Contrast

## Purpose
Ensure text and interactive elements have sufficient contrast against their backgrounds for readability and accessibility.

## Input
- Text colors and sizes
- Background colors
- UI element specifications

## Output
- Contrast ratio calculations
- Pass/Fail against WCAG standards
- Recommendations for fixes

## Decision Criteria

### PASS (Good Contrast)
- **Normal text (< 18px)**: 4.5:1 minimum (WCAG AA)
- **Large text (>= 18px bold or >= 24px)**: 3:1 minimum
- **UI components (buttons, inputs)**: 3:1 minimum for boundaries
- **Focus indicators**: 3:1 minimum against adjacent colors

### FAIL (Poor Contrast)
- Light gray text on white (< 4.5:1)
- White text on light colors
- Disabled states that look like active (too much contrast)
- Placeholder text same as input text

## Contrast Ratio Quick Reference

| Text Color on White | Ratio | Pass AA? |
|---------------------|-------|----------|
| #000000 (black) | 21:1 | Yes |
| #333333 | 12.6:1 | Yes |
| #666666 | 5.9:1 | Yes |
| #757575 | 4.6:1 | Yes (minimum) |
| #999999 | 2.8:1 | No |
| #CCCCCC | 1.6:1 | No |

## Common Failure Modes

| Failure | Description | Fix |
|---------|-------------|-----|
| **Light Gray Text** | #999 or lighter for body text | Use #666 minimum, #333 preferred |
| **Ghost Text** | Placeholder same as value | Make placeholder lighter (#999) |
| **Low-contrast Primary** | Brand color too light for white text | Darken brand color or use dark text |
| **Subtle Links** | Links barely different from text | Add underline or increase contrast |
| **Disabled Confusion** | Disabled buttons too prominent | Reduce to 30% opacity or use gray |
