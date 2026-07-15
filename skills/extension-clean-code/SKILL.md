---
name: extension-clean-code
description: >-
  Write clean, secure, maintainable browser extension code, especially for
  Microsoft Edge (Chromium) and compatible browsers (Chrome, Firefox, Opera).
  Use this skill whenever working on ANY browser extension — building one from
  scratch for Edge, fixing a content script, writing a background service
  worker, designing message passing between popup/content/background, injecting
  UI into web pages, setting up downloads or storage, managing extension state,
  handling permissions, building the popup UI, or reviewing/refactoring/auditing
  existing extension code. This covers all extension types: Edge extensions
  that enhance browsing, content scrapers, page enhancers, developer tools,
  productivity extensions, automation tools, media downloaders, ad blockers,
  and any other browser extension. It enforces clean-code patterns, security
  rules, and Manifest V3 best practices that work on Edge, Chrome, Firefox,
  and Opera. Use it aggressively — writing an extension without these patterns
  produces fragile, unreviewable, hard-to-maintain code that gets rejected
  in store reviews.
---

# Clean Browser Extension Code

## Critical: follow the prompt, not your priors

When the user provides specific code in their prompt — inline code blocks, manifest snippets, content script samples — you must work with THAT code. Do not substitute code from a different extension you know about. Do not assume the code belongs to any particular project. Read the prompt's code literally and audit, fix, or build exactly what's shown.

When auditing code, the prompt's code blocks are the ONLY source of truth. If no code is provided, ask. If code IS provided, use it — verbatim.

A browser extension has three isolated contexts that communicate via message passing. Understanding their capabilities, constraints, and lifetimes is the foundation for clean, robust extension code.

## Architecture: the three tiers

```
┌──────────────────────────────────────────────────────────────────┐
│  popup.html  ←──→  background.js (service worker)  ←──→  content.js │
│  (temporary UI)     (orchestration, no DOM)        (DOM access)    │
│                            ↕                                        │
│                     browser.downloads                               │
│                     browser.storage                                 │
│                     browser.alarms                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Content script** — injected into web pages. Full DOM access, limited browser.\* APIs.
**Service worker** (Chrome MV3, Firefox MV3) or **background page** — background orchestration. No DOM, may terminate after ~30s idle (service worker).
**Popup** — the extension's UI. Lives only while the user is viewing it.

Every extension follows this three-tier architecture. The patterns below make that code clean, secure, and maintainable across all browsers.

### Browser differences at a glance

| Feature | Edge (Chromium) | Chrome | Firefox |
|---------|----------------|--------|---------|
| Engine | Chromium (Blink) | Chromium (Blink) | Gecko |
| APIs | `chrome.*` | `chrome.*` | `browser.*` (or `chrome.*`) |
| Background | Service worker (~30s idle) | Service worker (~30s idle) | Service worker or persistent page |
| Store | Microsoft Partner Center | Chrome Web Store | Firefox Add-ons |
| Dev tools | Same as Chrome DevTools | Chrome DevTools | Firefox DevTools |

Edge uses the same Chromium engine as Chrome — code written for Edge works in Chrome and Opera without changes. Firefox supports `chrome.*` aliases for compatibility. The patterns in this skill use `chrome.*` throughout but apply identically to `browser.*` APIs. **Microsoft Edge is the primary target.**

---

## 1. Manifest design

Request the **minimum permissions**. Every permission is a tradeoff.

```json
{
  "manifest_version": 3,
  "permissions": ["activeTab", "storage", "downloads"],
  "host_permissions": ["https://*.example.com/*"],
  "background": { "service_worker": "background.js", "type": "module" },
  "content_scripts": [{
    "matches": ["https://*.example.com/*"],
    "js": ["content.js"]
  }],
  "action": { "default_popup": "popup.html" },
  "icons": { "16": "icon16.png", "48": "icon48.png", "128": "icon128.png" }
}
```

- Prefer `activeTab` over broad `host_permissions`.
- Pin `host_permissions` to specific domains.
- Always include `icons` — without them the extension shows a gray placeholder.

---

## 2. Content scripts — DOM interaction

Content scripts are the only context with DOM access. They extract data from pages and optionally inject UI.

### Extraction patterns

**Single-pass DOM traversal.** Traverse once and collect everything. Avoid multiple independent queries.

**De-duplication.** Use a `Set` keyed by a stable identifier (file path, basename, or content hash) — not the full URL, since CDNs may serve the same asset at different URLs.

```javascript
const extractItems = () => {
  const items = [];
  const seen = new Set();

  // One pass: query for the most specific selector first
  const elements = document.querySelectorAll('a[href*="/photo"]');
  for (const el of elements) {
    const url = resolveUrl(el);
    if (!url) continue;

    const key = url.split('/').pop().split('?')[0];
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({ url, type: 'photo' });
  }

  return items;
};
```

**Resolution cascade.** When a DOM element has multiple possible source URLs (`src`, `srcset`, `data-*` attributes on the element and its parent), try them in order of reliability:

```
data attrs on element  →  parent's data attrs  →  srcset best match  →  element's src
```

**Validate at the boundary.** Data extracted from the DOM (untrusted) must be validated:

```javascript
const isValidContentUrl = (url) => {
  return url &&
    (url.startsWith('http://') || url.startsWith('https://')) &&
    !url.includes('/emoji.php/') &&
    !url.includes('/rsrc.php/');
};
```

### UI overlays

When injecting UI into a page:

- Use a unique ID to prevent duplicates on re-injection.
- Attach a cleanup function that removes the overlay and its associated `<style>`.
- Respect `prefers-reduced-motion` by disabling animations when set.
- Make injected buttons keyboard-accessible (native `<button>` elements are already focusable).
- Set `role` and `aria-*` attributes for screen readers.

```javascript
const OVERLAY_ID = 'my-ext-overlay';
const STYLE_ID = 'my-ext-style';

const injectOverlay = () => {
  if (document.getElementById(OVERLAY_ID)) return;

  const el = document.createElement('div');
  el.id = OVERLAY_ID;
  // ... populate ...

  document.body.appendChild(el);
};

const removeOverlay = () => {
  document.getElementById(OVERLAY_ID)?.remove();
  document.getElementById(STYLE_ID)?.remove();
};
```

### SPA navigation — MutationObserver over polling

For single-page apps that change content without a full page load, observe a stable element's mutations rather than polling on an interval:

```javascript
let lastUrl = location.href;
const titleEl = document.querySelector('title');

if (titleEl) {
  const observer = new MutationObserver(() => {
    const current = location.href;
    if (current !== lastUrl) {
      lastUrl = current;
      onPageChange();
    }
  });
  observer.observe(titleEl, { childList: true });
}
```

Only fall back to `setInterval` polling when there is no stable DOM element to observe.

---

## 3. Background service worker

The service worker orchestrates work. It has no DOM access and may be terminated after ~30s of inactivity.

### Queue pattern

For sequential processing of items (downloads, API calls, data processing use a simple `while` loop with pause/resume/cancel:

```javascript
let queue = [];
let status = 'idle'; // 'idle' | 'running' | 'paused'
let cursor = 0;

const processQueue = async () => {
  while (status === 'running' && cursor < queue.length) {
    const item = queue[cursor];

    try {
      await processItem(item);
    } catch (err) {
      logError(item, err);
    }

    cursor++;
    broadcast();

    if (status === 'running' && cursor < queue.length) {
      await delay(THROTTLE_MS);
    }
  }

  if (status === 'running' && cursor >= queue.length) {
    onComplete();
  }
};
```

The loop naturally exits when paused (status changes), making pause/resume/cancel trivial.

### Fetch with retry

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
      log(`Retry ${i + 1}/${retries}: ${err.message}`);
      await delay(delay * Math.pow(2, i));
    }
  }
};
```

### Throttled broadcasts

Don't flood the message channel. Throttle status updates:

```javascript
let broadcastTimer = null;

const broadcast = () => {
  if (broadcastTimer) return;
  broadcastTimer = setTimeout(() => {
    broadcastTimer = null;
    chrome.runtime.sendMessage({ type: 'STATUS', data: getState() }).catch(() => {});
  }, 200);
};
```

The `.catch(() => {})` is essential — the popup may be closed.

### Tab lifecycle

Clean up state when the user navigates away or closes the tab:

```javascript
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (tabId === activeTabId && changeInfo.status === 'loading') cleanup();
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) cleanup();
});
```

---

## 4. Message passing

Messages connect all three contexts. The rules are simple but critical.

### Sending

```javascript
// To content script (from popup)
chrome.tabs.sendMessage(tabId, { type: 'SCAN' }, (response) => {
  if (chrome.runtime.lastError) return; // script not injected
  handleResponse(response);
});

// To service worker (from anywhere)
chrome.runtime.sendMessage({ type: 'ACTION', data: payload }).catch(() => {});

// To popup (from anywhere) — popup may be closed
chrome.runtime.sendMessage({ type: 'UPDATE' }).catch(() => {});
```

### Receiving

```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ASYNC_ACTION') {
    doAsync().then(result => sendResponse(result));
    return true; // ← critical for async responses
  }

  if (message.type === 'SYNC_ACTION') {
    sendResponse(syncResult());
    // No return true needed
  }
});
```

**Never forget `return true`** for asynchronous responses — without it, the port closes before `sendResponse` is called.

**Never forget `.catch(() => {})`** when sending to a context that may not be listening.

### Complete examples: fix BOTH sides

When diagnosing a message passing bug or explaining an anti-pattern, always show executable code for BOTH the sending and receiving contexts. A fix that only shows the background handler is incomplete:

- Show the **receiving** side (background listener) with `return true`, proper error handling, and response shape.
- Show the **sending** side (popup or content script) with `lastError` check and response handling.

This applies to any fix or explanation involving chrome.runtime.onMessage or chrome.tabs.sendMessage.

---

## 5. Clean-code rules

### No magic numbers

Every hardcoded value that controls behavior must be a named constant at the top of the file:

```javascript
const RETRY_MAX = 3;
const RETRY_BACKOFF_MS = 2000;
const SCROLL_STEP_PX = 1000;
const MIN_ITEM_SIZE_PX = 180;
const THROTTLE_MS = 200;
const ANIMATION_DURATION_MS = 300;
```

### Small functions, one thing each

If a function body has two distinct phases separated by a blank-line comment, extract the second phase into its own function:

```javascript
// BAD: two responsibilities
const process = () => {
  // Extract items from DOM
  const items = [];

  // Save to storage
  chrome.storage.local.set({ items });
};

// GOOD: two functions
const extractItems = () => { /* ... */ };
const persistItems = (items) => { /* ... */ };
```

### Never swallow errors

A catch block that does nothing or silently returns a success value is a bug:

```javascript
// BAD
try { await fetch(url); } catch (e) {}

// GOOD
try { await fetch(url); } catch (e) {
  logError(`Failed: ${e.message}`);
}
```

### Validate at trust boundaries

Data from the DOM (untrusted) — validate it.
Data from your own extension contexts (trusted) — no re-validation needed.

```javascript
// At the trust boundary: DOM → content script
const rawUrl = img.getAttribute('data-src');
if (!isValidUrl(rawUrl)) continue;
processUrl(rawUrl); // safe to process

// Inside the extension boundary: no re-validation needed
chrome.runtime.sendMessage({ type: 'PROCESS', data: { url: validUrl } });
```

### Delete dead code before delivery

- Commented-out code → delete.
- Unused functions → delete.
- Unreferenced CSS classes → delete.
- Console.log debugging statements → delete.

### Match the file's conventions

Before editing any extension file, read it first. Match its casing style, error handling pattern, event binding style, and comment style. Don't introduce a second convention.

### Config objects over parameter sprawl

```javascript
// BAD: 5 positional params
const start = (items, settings, name, tabId, callback) => {};

// GOOD: config object
const start = ({ items, settings, albumName, tabId, onComplete }) => {};
```

---

## 6. Security rules

- Set `referrerPolicy: "no-referrer"` on images fetched from third-party CDNs.
- Sanitize filenames before `chrome.downloads.download`: `name.replace(/[\\/:*?"<>|]/g, '_')`.
- Validate every URL extracted from the DOM: protocol, domain, known resource exclusions.
- Use `textContent` or `createElement`, never `innerHTML`, with DOM-extracted content.
- Always `.catch(() => {})` on `chrome.runtime.sendMessage` to contexts that may not be listening.

---

## Reference files

Read these when you need deeper guidance on a specific area:

- `references/content-scripts.md` — DOM scraping, resolution cascades, MutationObserver, overlays
- `references/background-worker.md` — Queue management, fetch/retry, downloads, tab lifecycle
- `references/messaging.md` — Message passing patterns, async responses, common pitfalls
- `references/clean-code-patterns.md` — Full clean-code ruleset with extension-specific examples
- `references/mv3-architecture.md` — Manifest design, permissions, service worker lifecycle
- `references/popup-ui.md` — Settings persistence, accessibility, tab navigation, grid rendering

### External: clean-code-guard skill

For general-purpose clean-code rules and AI-specific failure modes beyond the extension context, consult the `clean-code-guard` skill (at the same skill-root level):

- `clean-code-guard/references/ai-failure-modes.md` — 14 systematic ways LLMs produce bad code. Read this when reviewing generated code for correctness.
- `clean-code-guard/references/naming-and-functions.md` — Function size, naming, parameters, CQS
- `clean-code-guard/references/comments-and-formatting.md` — Comment discipline, matching file style
- `clean-code-guard/references/solid.md` — SRP, OCP, LSP, ISP, DIP with smells
- `clean-code-guard/references/dry-kiss-yagni.md` — Duplication vs abstraction decisions
- `clean-code-guard/references/review-checklist.md` — Full structured checklist for code review mode
