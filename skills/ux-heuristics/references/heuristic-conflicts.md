# Resolving Heuristic Conflicts

## 5 Major Conflicts

1. **Simplicity vs. Flexibility** - Progressive disclosure, persona-based modes
2. **Consistency vs. Context Optimization** - Consistent patterns, contextual prominence
3. **Efficiency vs. Error Prevention** - Undo instead of confirm, confidence-based friction
4. **Discoverability vs. Clean Interface** - Primary actions visible, secondary in menus, command palettes
5. **Guidance vs. User Control** - Inline guidance, warnings not blockers

## 5-Step Resolution Framework
1. Identify the conflict (name specific heuristics)
2. Assess the context (user type, task criticality, frequency, reversibility, consequence)
3. Prioritize for this context (decision table)
4. Design for both when possible (both-and solutions)
5. Test the trade-off (validate with real users)

## Common Scenarios
- Onboarding: allow skip but show value, progressive onboarding
- Mobile Nav: bottom nav for 3-5 items, hamburger for secondary
- Form Validation: validate on blur, inline errors, allow submission
- Confirmation Dialogs: only for irreversible/high-cost, undo > confirm
- Default Settings: smart defaults, easy to change, no forced config

## Key Principles
Context is king. Know your users. Design for both. Make conscious trade-offs. Document decisions. Revisit.
