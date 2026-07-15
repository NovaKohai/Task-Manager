# Background service worker — deep reference (Edge + Chromium browsers)

## Service worker lifecycle (MV3 on Edge, Chrome, Firefox)

The service worker is **not persistent** like the old background page. Key behaviors:

- It boots when an event fires (`chrome.runtime.onMessage`, `chrome.tabs.onUpdated`, `chrome.alarms.onAlarm`).
- It can be terminated after ~30 seconds of inactivity (Edge and Chrome). Firefox may keep it alive longer.
- In-memory state is **lost on termination** in Edge and Chrome. Use `chrome.storage.local` for durable state.

Design implications:
- Don't rely on timers (`setTimeout` / `setInterval`) for work that must survive a restart. Use `chrome.alarms`.
- Re-initialize state from `chrome.storage.local` on each boot if needed.
- Don't use DOM APIs — the service worker has no DOM access.
- Use `importScripts('lib.js')` at the top of the file to load utility libraries.

## Queue pattern for sequential work

When processing a list of items (downloads, API calls), use a while loop with pause/resume/cancel:

```javascript
let queue = [];
let queueStatus = 'idle'; // 'idle' | 'downloading' | 'paused'
let queueIndex = 0;
let completedCount = 0;
let failedCount = 0;

const processQueue = async () => {
  while (queueStatus === 'downloading' && queueIndex < queue.length) {
    const item = queue[queueIndex];

    try {
      await processItem(item);
      completedCount++;
    } catch (err) {
      failedCount++;
      logError(item, err);
    }

    queueIndex++;
    broadcastStatus();

    // Throttle between items
    if (queueStatus === 'downloading' && queueIndex < queue.length) {
      await delay(throttleMs);
    }
  }

  if (queueStatus === 'downloading' && queueIndex >= queue.length) {
    onQueueComplete();
  }
};
```

Pause sets `queueStatus = 'paused'` — the loop naturally exits because the `while` condition fails. Resume sets `queueStatus = 'downloading'` and calls `processQueue()` again. Cancel resets all state.

## Tab lifecycle listeners

Clean up when the user leaves the page:

```javascript
// Tab navigated or refreshed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.status === 'loading') {
    abortQueue('Tab navigated or refreshed');
  }
});

// Tab closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    abortQueue('Tab closed');
  }
});
```

## Fetch with retry

Network requests from the service worker should handle transient failures:

```javascript
const RETRY_CONFIG = { maxRetries: 3, backoffBaseMs: 2000 };

const fetchWithRetry = async (url, retries = RETRY_CONFIG.maxRetries, delay = RETRY_CONFIG.backoffBaseMs) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.arrayBuffer();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`Retry ${i + 1}/${retries} for ${url}: ${err.message}`);
      await delay(delay * Math.pow(2, i));
    }
  }
};
```

Rules:
- Catch only the specific error type you can retry on (network failures, 5xx). Let unrecoverable errors (4xx, invalid URL) propagate immediately.
- Exponential backoff prevents hammering a recovering server.
- Each retry attempt is logged so the user knows what's happening.
- `RETRY_CONFIG` is a named constant, not inline numbers.

## Throttled broadcasts

Broadcasting status after every item floods the message channel. Throttle:

```javascript
let broadcastTimer = null;

const broadcastStatus = () => {
  if (broadcastTimer) return;
  broadcastTimer = setTimeout(() => {
    broadcastTimer = null;
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', data: getState() })
      .catch(() => {}); // Popup may be closed
  }, 200);
};
```

The `.catch(() => {})` is essential — if the popup is closed, `sendMessage` will throw.

## chrome.downloads.download wrapper

Wrap the callback-style API in a Promise:

```javascript
const downloadFile = (url, filename) => {
  return new Promise((resolve, reject) => {
    chrome.downloads.download({
      url,
      filename,
      conflictAction: 'uniquify',
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(downloadId);
      }
    });
  });
};
```

Always sanitize filenames before download:

```javascript
const sanitizeFilename = (name) => {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim();
};
```

## Data URLs for generated files

When you need to save a file generated in-memory (e.g., a ZIP), convert it to a data URL and pass it to `chrome.downloads.download`:

```javascript
const bytes = new Uint8Array(buffer);
const charCodes = new Array(bytes.length);
for (let i = 0; i < bytes.length; i++) {
  charCodes[i] = String.fromCharCode(bytes[i]);
}
const dataUrl = `data:application/zip;base64,${btoa(charCodes.join(''))}`;
await downloadFile(dataUrl, 'archive.zip');
```
