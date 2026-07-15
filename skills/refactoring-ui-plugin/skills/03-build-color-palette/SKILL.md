---
name: build-color-palette
description: Create comprehensive palette with 8-10 greys, 5-10 primary, 5-10 accent shades
domain: ui-design
skill-type: generative
version: 1.0.0
author: refactoring-ui-expert
---

# Skill: Build Color Palette

## Purpose
Create a comprehensive, systematic color palette with sufficient shades to build realistic interfaces (8-10 greys, 5-10 primary shades, 5-10 accent shades).

## Input
- Brand color(s) or design mood/intent
- UI complexity (simple landing page vs. complex dashboard)
- Required semantic meanings (success, error, warning, info)
- Need for categorical colors (charts, calendars, tags)

## Output
- Color palette specification with multiple shades per color
- Role assignment for each shade
- Usage guidelines
- Pass/Fail assessment of existing palette

## Decision Criteria

### PASS (Good Color Palette)
- **Greys: 8-10 shades** - For text, backgrounds, panels, form controls
- **Primary: 5-10 shades** - One or two core colors for primary actions, active navigation
- **Accent: 5-10 shades each** - For semantic states (red, yellow, green), new features, categorization
- **Systematic shades**: Each color has light to dark variants defined upfront
- **Clear hierarchy**: Primary color defines overall look; accents used sparingly
- **Sufficient contrast**: All text meets WCAG AA (4.5:1 for normal, 3:1 for large)
- **Not using opacity**: Explicit hex values for all shades

### FAIL (Poor Color Palette)
- Too few greys (3-4 shades leading to compromises)
- Missing shades of primary color (can't create hover states, subtle backgrounds)
- Not enough accent colors for semantic states and categorization
- **Using opacity (rgba) instead of defined shades** (inconsistency)
- Missing systematic shade progression
- Insufficient contrast for accessibility

## The Palette Structure

### Greys (8-10 shades)
```
White / Near-white: #FFFFFF, #F9FAFB
Gray 100: #F3F4F6 - Subtle backgrounds
Gray 200: #E5E7EB - Borders, dividers
Gray 300: #D1D5DB - Disabled states
Gray 400: #9CA3AF - Placeholder text
Gray 500: #6B7280 - Secondary text
Gray 600: #4B5563 - Body text
Gray 700: #374151 - Strong text
Gray 800: #1F2937 - Headings
Gray 900: #111827 - Near-black text
```

### Primary Colors (5-10 shades)
```
Primary 50: Ultra-light (alert backgrounds)
Primary 100: Very light (subtle backgrounds)
Primary 200-300: Light (hover states)
Primary 400-500: Base (buttons, links)
Primary 600-700: Dark (hover text, emphasis)
Primary 800-900: Very dark (text on light)
```

### Accent Colors (5-10 shades each)

| Color | Use Case |
|-------|----------|
| **Red** | Destructive actions, errors, warnings |
| **Yellow/Amber** | New features, caution, highlights |
| **Green** | Success, positive trends, confirmation |
| **Teal/Pink/Purple** | Feature highlights, categorization, calendars |

Each accent needs 5-10 shades just like primary colors.

## Common Failure Modes

| Failure | Description | Fix |
|---------|-------------|-----|
| **5-Color Generator** | Using only 5 hex codes for entire UI | Build comprehensive palette with 8-10 greys, 5-10 primary, 5-10 accent shades |
| **Too Few Greys** | 3-4 grey shades | Expand to 8-10 greys |
| **Opacity for Shades** | Using `rgba()` to create lighter/darker | Define explicit hex shades upfront |
| **Missing Hover States** | No lighter/darker variants | Each interactive color needs 5-10 shades |
| **Missing Semantic Colors** | Only brand colors, no red/yellow/green | Add accent colors for errors, warnings, success |
| **True Black Text** | Using #000000 (harsh) | Start with #111827 or #1F2937 |
