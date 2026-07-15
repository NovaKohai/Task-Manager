# Manifest V3 architecture — deep reference (Edge + Chromium browsers)

## Manifest structure

```json
{
  "manifest_version": 3,
  "name": "Extension Name",
  "version": "1.0.0",
  "description": "Short description",
  "permissions": ["activeTab", "storage"],
  "host_permissions": ["https://*.example.com/*"],
  "background": { "service_worker": "background.js" },
  "content_scripts": [{
    "matches": ["https://*.example.com/*"],
    "js": ["content.js"]
  }],
  "action": { "default_popup": "popup.html" },
  "icons": { "16": "icon16.png", "48": "icon48.png", "128": "icon128.png" }
}
```

## Permissions design

Request the minimum. Every permission is a tradeoff between capability and the install friction / review burden.

- `activeTab` — temporary access to the current tab (no install-time warning). Preferred over broad host permissions.
- `storage` — `chrome.storage.local` and `chrome.storage.sync`. Needed for most extensions.
- `downloads` — required for `chrome.downloads.download()`.
- `host_permissions` — specify exact domains. Use `https://*.specific-site.com/*` not `https://*/*`.

## Service worker vs background page

| | Background page (legacy) | MV3 service worker |
|---|---|---|
| Lifetime | Always running | ~30s idle, then terminated |
| DOM access | Yes | No |
| `window` / `document` | Available | Not available |
| `setTimeout` past 30s | Works | May not fire |
| `importScripts` | Works | Works (top-level only) |

Edge and Chrome use service workers in MV3. Firefox supports both. Design for the service worker model — it's the standard going forward.

Workarounds:
- Use `chrome.storage.local` for persistent state across terminations.
- Use `chrome.alarms` for recurring tasks that must survive termination.
- Initialize state from storage on each message handler call.

## Content scripts `run_at`

- `document_start` — before DOM is built. Very few use cases.
- `document_end` — after DOM is built but before subresources load.
- `document_idle` (default) — after page load. Best for most cases: DOM ready, images loaded, performance impact minimal.

## Icons

Always provide icons at 16x16, 48x48, and 128x128 in PNG format. The extension shows a gray placeholder without them. These are loaded from the extension package, so paths are relative to the extension root.
