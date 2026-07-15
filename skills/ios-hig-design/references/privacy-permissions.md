# iOS Privacy & Permissions

## Permission Request Philosophy

Request permissions only when needed, not at launch. Explain why first.

## Permission Request Timing

1. **Contextual**: Request right before the feature needs it
2. **Explained**: Show a pre-permission screen explaining why
3. **Optional**: Never block app usage on permission grant

## Pre-Permission Screens

```swift
// Show this BEFORE system permission dialog
struct LocationExplanation: View {
    var body: some View {
        VStack {
            Image(systemName: "location.fill")
            Text("Find nearby restaurants")
            Text("We use your location to show restaurants near you")
            Button("Enable Location") {
                // Now request system permission
                locationManager.requestWhenInUseAuthorization()
            }
            Button("Not Now") { }
        }
    }
}
```

## Permission Types & Best Practices

| Permission | When to Request | Pre-Permission Explanation |
|------------|-----------------|----------------------------|
| Location | When user taps "Find Near Me" | "Show places near you" |
| Camera | When user taps camera button | "Take photos for your profile" |
| Photos | When user wants to save/upload | "Save this image to your library" |
| Notifications | After user completes onboarding | "Get notified when someone messages you" |
| Contacts | When user wants to invite friends | "Find friends who are already here" |

## Handling Denied Permissions

- Detect denied state and show settings redirect
- Never re-prompt after denial
- Provide manual alternatives (type address instead of location)

```swift
if authorizationStatus == .denied {
    // Show alert with "Open Settings" action
}
```

## App Privacy Labels

Accurately list all data collection in App Store Connect.
