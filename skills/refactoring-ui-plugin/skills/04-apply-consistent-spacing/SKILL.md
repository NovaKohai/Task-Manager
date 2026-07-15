---
name: apply-consistent-spacing
description: Use systematic spacing with 25% minimum jumps, start with excess whitespace
domain: ui-design
skill-type: generative
version: 1.0.0
author: refactoring-ui-expert
---

# Skill: Apply Consistent Spacing

## Purpose
Use a systematic spacing scale to create rhythm, group related elements, and separate distinct sections while starting with generous whitespace and removing as needed.

## Decision Criteria

### PASS (Good Spacing)
- Uses systematic scale with minimum 25% jumps between values (12px -> 16px -> 24px -> 32px)
- Related elements have smaller gaps (4-16px within groups)
- Unrelated sections have larger gaps (24-64px between groups)
- **More space around groups than within groups**
- Consistent internal padding (cards, buttons, inputs)
- White space creates breathing room
- Uses whitespace instead of borders for separation

### FAIL (Poor Spacing)
- Arbitrary values without system (13px, 27px, 41px)
- Values too similar (<25% difference)
- Related elements too far apart
- Unrelated elements too close together
- **Equal spacing everywhere** (within groups = between groups)
- Content stretched to fill wide canvas unnecessarily
- Using borders when whitespace would suffice

## The Spacing Scale

### Systematic Scale (25% minimum jumps)
Base: 16px (browser default)
```
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px
```

### Common Usage Patterns
| Spacing | Usage |
|---------|-------|
| 4px | Icon gaps, tight internal padding |
| 8px | Small component gaps, tight button padding |
| 12px | Input padding, component internal spacing |
| 16px | Standard gap, card padding |
| 24px | Section internal padding, larger gaps |
| 32px | Major section separation |
| 48-64px | Page section breaks |
| 96px | Hero sections, major page divisions |

## Key Principles

### 1. Start With Too Much Whitespace
Start with way too much space and remove until it's right.

### 2. Avoid Ambiguous Spacing
Ensure there is **more space around the entire group** than within the group.

### 3. Don't Fill The Whole Screen
Give elements exactly the space they need. Leave extra as whitespace.

### 4. Whitespace > Borders
Instead of using borders to separate elements, use extra spacing.

## Common Failure Modes

| Failure | Description | Fix |
|---------|-------------|-----|
| **Arbitrary Values** | 15px here, 17px there | Use systematic scale exclusively |
| **Weak Grouping** | Equal spacing within and between groups | Make between-group spacing significantly larger |
| **Ambiguous Spacing** | Label and input have same margin | Reduce within-group, increase between-groups |
| **Border-Dependence** | Using borders instead of space | Increase gap, remove border |
| **Canvas Filling** | Content stretched to 1200px unnecessarily | Use only the space needed |
| **Inconsistent Padding** | Some buttons 8px, others 12px | Pick one scale value, apply everywhere |
