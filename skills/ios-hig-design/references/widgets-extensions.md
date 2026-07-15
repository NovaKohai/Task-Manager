# iOS Widgets & Extensions

## Widget Design

Widgets provide glanceable information from your app.

### Sizes

| Size | Width | Height | Content |
|------|-------|--------|---------|
| Small | 170pt | 170pt | Single metric or action |
| Medium | 364pt | 170pt | More detail, list items |
| Large | 364pt | 382pt | Full information, scrolling |

### Design Guidelines

- Content must be glanceable (under 5 seconds)
- Tapping widget opens specific app location
- Use the same visual language as your app (colors, fonts)
- Avoid text-only widgets; use data visualizations
- Support all three sizes with progressive disclosure

### Widget Configuration

Allow users to configure widgets (select city, stock, etc.):

```swift
struct StockWidget: Widget {
    var body: some WidgetConfiguration {
        IntentConfiguration(kind: "StockPrice", intent: SelectStockIntent.self) { entry in
            StockWidgetView(entry: entry)
        }
        .configurationDisplayName("Stock Price")
        .description("Show a stock price")
    }
}
```

## Live Activities

For real-time events (sports scores, delivery tracking, timers):

- Dynamic Island integration on iPhone 14 Pro+
- Lock Screen and Dynamic Island displays
- Active for limited duration (max 8 hours)
- Update via remote push or local activity

## App Clips

Lightweight version of app (under 10MB) for quick tasks:
- QR code, NFC, Safari App Banner, Messages link triggers
- Focused on single task (order coffee, rent scooter, pay parking)
- Suggests full app installation after task completion
