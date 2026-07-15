# WCAG 2.1 AA Checklist

## Perceivable
- 1.1.1 Non-text Content: alt text for images, icons, CAPTCHA audio alternative
- 1.2 Time-based Media: captions, audio descriptions, transcripts
- 1.3 Adaptable: semantic HTML (h1-h6, ul/ol, labels, th), logical reading order, orientation support, autocomplete attributes
- 1.4 Distinguishable: 4.5:1 text contrast (3:1 large text), 200% zoom, reflow at 320px, 3:1 UI contrast

## Operable
- 2.1 Keyboard: all functionality keyboard-accessible, no traps, single-key shortcuts remappable
- 2.2 Enough Time: 20s timeout warning, pause auto-updating content
- 2.3 Seizures: no >3 flashes/second
- 2.4 Navigable: skip links, descriptive titles, logical focus order, meaningful link text, multiple nav methods, visible focus indicator
- 2.5 Input Modalities: alternative to complex gestures, pointer cancellation, accessible name matches label, non-motion alternatives

## Understandable
- 3.1 Readable: lang attribute, foreign language markup
- 3.2 Predictable: no unexpected changes on focus/input, consistent navigation, consistent identification
- 3.3 Input Assistance: error identification, labels, suggestions, prevention for legal/financial

## Robust
- 4.1 Compatible: valid HTML, correct ARIA roles/states, aria-live for status messages

## Testing Tools
- Automated: axe DevTools (~30%), WAVE, Lighthouse, Pa11y
- Manual: keyboard, screen reader (VoiceOver/NVDA), 200% zoom, contrast checker, color blindness sim
