---
name: eliminate-visual-clutter
description: Remove unnecessary borders, backgrounds, shadows, decorations
domain: ui-design
skill-type: corrective
version: 1.0.0
author: refactoring-ui-expert
dependencies:
  - 04-apply-consistent-spacing
---

# Skill: Eliminate Visual Clutter

## Purpose
Remove unnecessary visual elements (borders, backgrounds, shadows, decorations) that don't serve functional purposes.

## Input
- Design screenshot or description
- Element inventory (borders, shadows, backgrounds, separators)

## Output
- Clutter assessment (what can be removed)
- Simplified design specification

## Decision Criteria

### PASS (Clean Design)
- Every visual element serves a functional purpose
- Whitespace used instead of borders to separate
- No decorative shadows or gradients without purpose
- Backgrounds used sparingly
- Minimal separator lines

### FAIL (Cluttered Design)
- Borders on everything ("boxy" look)
- Shadows used decoratively
- Multiple separator lines between sections
- Background colors on every component
- Decorative elements that don't communicate meaning

## Elements to Question

| Element | Ask | Often Remove? |
|---------|-----|---------------|
| **Borders** | Does this need a border, or just space? | Yes, use margin instead |
| **Card backgrounds** | Does this need a box, or just whitespace? | Often, let space define groups |
| **Separators** | Does this need a line, or just more space? | Usually, increase gap instead |
| **Shadows** | Does this need depth, or is it decorative? | Often, flatten |
| **Background colors** | Is this color communicating something? | If purely decorative, remove |

## The Progression of Simplification

1. **Start with everything** (borders, shadows, backgrounds)
2. **Remove borders** -> Use spacing instead
3. **Remove backgrounds** -> Use whitespace to group
4. **Remove separators** -> Increase space between sections
5. **Remove shadows** -> Keep only for elevation (modals, dropdowns)
6. **Add back only what's needed** for hierarchy or clarity

## Common Failure Modes

| Failure | Description | Fix |
|---------|-------------|-----|
| **Border-itis** | Every element has a box around it | Remove 50%+ of borders, use space |
| **Shadow Spam** | Shadows on static elements | Reserve for hover states and modals |
| **Separator Overload** | Lines between every section | Remove half, double the space |
| **Background Soup** | Every card has a gray background | Use white with space, or subtle border |
