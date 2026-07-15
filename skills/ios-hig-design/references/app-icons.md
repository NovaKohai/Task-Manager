# iOS App Icons

## Required Sizes

| Size | Usage |
|------|-------|
| 1024 x 1024px | App Store |
| 180 x 180px | iPhone home screen (@3x) |
| 120 x 120px | iPhone home screen (@2x), Spotlight |
| 167 x 167px | iPad Pro |
| 152 x 152px | iPad (@2x) |
| 87 x 87px | Settings |

## Icon Shape

iOS applies a **superellipse** ("squircle") mask automatically. Export icons as squares.

For custom border matching the shape:
- Corner radius = side length x 0.222
- Corner smoothing = 61% (iOS preset in Figma)

## Icon Guidelines

- Simple, recognizable silhouette
- Works at all sizes (remove fine details for small sizes)
- Consider light, dark, and tinted variants (iOS 18+)
- Avoid text in icons
