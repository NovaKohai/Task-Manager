# Cultural UX Considerations

## RTL Languages
- Arabic, Hebrew, Persian, Urdu
- Mirror: text alignment, nav, progress, directional icons, carousels
- NOT mirror: numbers, phone, clocks, video controls, logos, math
- CSS: use logical properties (margin-inline-start, padding-inline-end, text-align: start)

## Color Meanings
- Red: danger (West) vs good luck (China) vs mourning (SAfrica)
- White: purity (West) vs death (China/Japan/India)
- Green: go/success (West) vs sacred (Islamic) vs infidelity (China)
- Blue: relatively safe globally (trust, calm)

## Form Conventions
- Name: Use "Full Name" or "Given/Family" not "First/Last"; allow 50+ chars
- Address: Don't require postal code globally; country-appropriate fields
- Phone: Accept multiple formats; store in E.164
- Dates: Use pickers; store ISO; display in locale
- Currency: Locale-appropriate formatting

## Text Considerations
- Text expansion: German/French/Russian/Spanish ~1.2-1.3x, Chinese/Japanese ~0.8-0.9x
- No text in images
- Units: metric vs imperial, 24h vs 12h, Celsius vs Fahrenheit

## Icons & Imagery
- Avoid: mailbox (US-specific), check mark (wrong in some cultures), thumbs up (offensive in some), hand gestures, religious symbols
- Represent target audience in photography
