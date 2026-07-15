# Message passing — deep reference (Edge + Chromium browsers)

## Three-context architecture

Browser extensions (Edge, Chrome, Firefox) have three execution contexts, each with different capabilities:

| Context | DOM access | chrome.* APIs | Lifetime |
|---------|-----------|---------------|----------|
| Content script | Yes | Limited (storage, runtime) | Tab lifetime |
| Service worker | No | Full | Ephemeral (~30s idle) |
| Popup | Yes | Full | While user is viewing |

Messages bridge these contexts. Understanding the lifecycle is critical — sending to a context that doesn't exist will fail silently or throw.

## Message types

Use descriptive string constants for message types. Treat them as an implicit enum:

```javascript
const MessageType = {
  SCAN_MEDIA: 'SCAN_MEDIA',
  START_DOWNLOAD: 'START_DOWNLOAD',
  PAUSE_DOWNLOAD: 'PAUSE_DOWNLOAD',
  QUEUE_STATUS_UPDATE: 'QUEUE_STATUS_UPDATE',
  DOWNLOAD_THEATER_PHOTO: 'DOWNLOAD_THEATER_PHOTO',
};
```

Using string constants prevents typos and makes it easy to grep for all message handlers.

## Sending messages

### To the content script (from popup)

```javascript
chrome.tabs.sendMessage(tabId, { type: 'SCAN_MEDIA' }, (response) => {
  if (chrome.runtime.lastError) {
    // Content script may not be loaded (page not matching, script not injected)
    console.warn('Content script unavailable:', chrome.runtime.lastError.message);
    return;
  }
  if (response && response.items) {
    processItems(response.items);
  }
});
```

### To the service worker (from popup or content script)

```javascript
// Safe send — catches if service worker isn't listening
chrome.runtime.sendMessage({
  type: 'START_DOWNLOAD',
  data: { items, settings, albumName }
}).catch(() => {});
```

### To the popup (from service worker or content script)

```javascript
// Popup may be closed — always catch
chrome.runtime.sendMessage({
  type: 'QUEUE_STATUS_UPDATE',
  data: state
}).catch(() => {});
```

## Receiving messages

### Synchronous response

```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    sendResponse({ status: 'idle', ... });
  }
  // No `return true` needed — response is synchronous
});
```

### Asynchronous response

```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DO_WORK') {
    doAsyncWork().then(result => {
      sendResponse(result);
    });
    return true; // REQUIRED: keeps the port open until sendResponse is called
  }
});
```

## Common pitfalls

### 1. Forgetting `return true`

If you call `sendResponse` asynchronously (inside a promise, callback, or timeout) and don't return `true` from the listener, the port closes and `sendResponse` is silently dropped.

```javascript
// WRONG — response is never received
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  fetch(url).then(data => sendResponse(data));
  // Missing: return true
});

// RIGHT
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  fetch(url).then(data => sendResponse(data));
  return true;
});
```

### 2. No receiver handling

If you send a message and nobody is listening (popup closed, content script not loaded), the promise rejects. Always catch.

```javascript
chrome.runtime.sendMessage({ type: 'UPDATE' }).catch(() => {
  // Receiver not available — that's OK
});
```

### 3. Over-fetching in response

Keep message payloads small. If you need to send many items, paginate or incrementally push via multiple messages. The extension messaging limit is approximately 64KB per message (though MV3 is more lenient, large payloads are still slow).

### 4. Circular messaging

A → B → A → B creates infinite loops. Use one-directional command patterns: popup commands service worker, service worker broadcasts status updates.

## Patterns by context

### Popup → Content script

Use `chrome.tabs.sendMessage` — requires the tab ID. Used for:
- Triggering a scan/scrape
- Starting/stopping automation
- Getting page state

### Popup → Service worker

Use `chrome.runtime.sendMessage` (no tab ID needed). Used for:
- Starting/canceling downloads
- Saving settings
- Getting queue status
- Initial sync on popup open

### Content script → Service worker

Use `chrome.runtime.sendMessage`. Used for:
- Sending scanned items for download
- Triggering background operations
- Reporting page state changes

### Service worker → Popup

Use `chrome.runtime.sendMessage`. Used for:
- Broadcasting queue progress
- Notifying completion
- Sending errors

Always catch — the popup is likely closed during long operations.

## Example: Complete flow

```
Popup                   Service Worker            Content Script
  │                          │                         │
  ├── START_SCROLL ──────────┤────── START_SCROLL ────►│
  │                          │                         ├── scroll page
  │                          │                         ├── scan DOM
  │                          │                         │
  │◄──── SCAN_COMPLETE ──────┤◄──── SCAN_COMPLETE ─────┤
  │                          │                         │
  ├── START_DOWNLOAD ───────►│                         │
  │                          ├── fetch(url1)           │
  │                          ├── fetch(url2)           │
  │◄── QUEUE_STATUS_UPDATE ──┤                         │
  │                          ├── ...                   │
```
