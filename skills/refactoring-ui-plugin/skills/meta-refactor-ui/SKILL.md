# Meta-Skill: /refactor-ui

## Purpose
Run a complete UI design audit against all 10 Refactoring UI principles, generating a prioritized list of specific improvements.

## Workflow

### Phase 1: Load Skill Registry
Validate all 10 skills available.

### Phase 2: Sequential Skill Application

Execute each skill in optimal order:

```
1. establish-visual-hierarchy
2. apply-typography-scale
3. build-color-palette
4. apply-consistent-spacing
5. design-button-hierarchy
6. eliminate-visual-clutter
7. design-empty-states
8. use-shadows-appropriately
9. manage-color-contrast
10. group-related-elements
```

### Phase 3: Consolidate Findings

Aggregate results from all skills:
- Collect all FAIL assessments
- Group by severity (Critical | High | Medium | Low)
- Remove duplicates (same issue caught by multiple skills)
- Prioritize by impact

### Phase 4: Generate Report

Output:
- overall_score: PASS | NEEDS_WORK | FAIL
- Summary of violations
- Priority fixes list
- Per-skill breakdown

## Execution Modes

### Mode: Quick Scan
- Run all 10 skills, report only FAILs

### Mode: Deep Analysis
- Run all 10 skills, report PASS with rationale
- Cross-reference between skills
- Suggest composition improvements

### Mode: Fix Mode
- Run all 10 skills
- Generate specific fix instructions
- Provide before/after code examples

## Usage Examples

### Example: Marketing Page
Input: Landing page description with hero, features, CTA

-> Overall: NEEDS_WORK
-> Critical: Visual hierarchy (CTA buried)
-> High: Typography (8 sizes, need 5)
-> Medium: Spacing (ambiguous grouping)
-> Priority fixes: [3 items]

### Example: Dashboard
Input: Analytics dashboard screenshot

-> Overall: PASS with suggestions
-> Visual hierarchy: PASS (clear primary)
-> Color palette: FAIL (only 4 greys)
-> Shadows: FAIL (decorative on cards)
-> Suggestions: [5 items]

## Implementation Notes
- Each skill must be invoked as a sub-agent with the target file(s)
- Results are aggregated into a single prioritized report
- Use the individual skill skills to analyze specific files
- Cross-reference findings between skills for comprehensive coverage
