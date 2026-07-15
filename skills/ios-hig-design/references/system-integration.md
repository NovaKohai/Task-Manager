# iOS System Integration

## Siri Integration

Make app features available via Siri:

```swift
// Define an intent
class StartWorkoutIntent: INIntent {
    @NSManaged var workoutType: String
}

// Handle the intent
class StartWorkoutIntentHandler: NSObject, StartWorkoutIntentHandling {
    func handle(intent: StartWorkoutIntent) {
        // Start workout logic
    }
}
```

## Shortcuts App Integration

Expose actions to the Shortcuts app for automation.

## Handoff

Let users start on one device and continue on another:

```swift
.userActivity("com.example.viewItem") { activity in
    activity.title = "Viewing \(item.name)"
    activity.userInfo = ["id": item.id]
    activity.isEligibleForHandoff = true
}
```

## Drag and Drop (iPad)

Support dragging content between apps and within your app.

## Universal Links

Deep link to specific content in your app:

```swift
func application(_ application: UIApplication, continue userActivity: NSUserActivity) -> Bool {
    guard let url = userActivity.webpageURL else { return false }
    // Parse URL and navigate to content
    return true
}
```

## Spotlight Search

Make app content searchable via system search.

## Focus & Notifications

Respect user's Focus modes:
- Don't override system notification settings
- Use notification groupings for related content
- Support time-sensitive delivery for urgent items
