# iOS Keyboard & Input Patterns

## Software Keyboard Types

| Input Type | Keyboard | Best For |
|------------|----------|----------|
| `.default` | Alphabetical | General text, names |
| `.emailAddress` | Email layout with @ and . | Email fields |
| `.phonePad` | Numeric keypad with * and # | Phone numbers |
| `.URL` | URL layout with .com, / | URL fields |
| `.numberPad` | Numeric 0-9 | PIN codes, quantities |
| `.decimalPad` | Numeric with decimal point | Prices, measurements |
| `.twitter` | @ and # shortcuts | Social media handles |
| `.webSearch` | Search with Go button | Search fields |
| `.asciiCapable` | ASCII only | Code entry |

## Text Content Types

```swift
TextField("Email", text: $email)
    .textContentType(.emailAddress)
    .keyboardType(.emailAddress)
```

## Keyboard Avoidance

iOS automatically adjusts for keyboard presentation. Ensure:
- Inputs are not hidden behind the keyboard
- Scroll views adjust content inset
- Tap outside clears keyboard

## Hardware Keyboard Support

- All functionality must work with keyboard navigation
- Support standard shortcuts (Cmd+C, Cmd+V, etc.)
- Tab between form fields
