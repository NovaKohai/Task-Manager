# Clean code patterns for Chrome Extensions

## Constants at the top

Every hardcoded number, string, interval, or threshold that controls behavior must be a named constant at the top of the file. This includes:

- Timeouts, intervals, delays
- Retry counts and backoff bases
- Scroll steps and stall limits
- Size thresholds (minimum pixels for images)
- CSS dimension values used in JS
- Animation durations

```javascript
// Top of content.js
const SCROLL_STALL_LIMIT = 8;
const SCROLL_STEP_PX = 1000;
const SCROLL_INTERVAL_MS = 1200;
const MIN_IMAGE_SIZE_PX = 180;
const THEATER_SLIDE_DELAY_MS = 3500;
```

Benefits: one place to tune, self-documenting, no magic numbers scattered through logic.

## One thing per function

A function should do one thing and be named for that thing. Signs you're doing too much:

- The name uses "and" ("scanAndDownload", "extractAndSave")
- The body has two distinct phases separated by a blank-line comment
- You can extract a helper with a name that doesn't restate the parent
- The function is longer than 20 lines

```javascript
// BAD: three things
const processMedia = () => {
  const items = extractMedia();              // thing 1
  items.forEach(item => download(item));     // thing 2
  chrome.storage.local.set({ lastScan: Date.now() }); // thing 3
};

// GOOD: three functions, each named for its job
const extractMedia = () => { /* ... */ };
const downloadItems = (items) => { /* ... */ };
const saveScanTimestamp = () => { /* ... */ };
```

## Parameter limits

A function with 4+ parameters should use a config object:

```javascript
// BAD
const startDownload = (items, settings, albumName, tabId, callback) => {};

// GOOD
const startDownload = ({ items, settings, albumName, tabId, onComplete }) => {};
```

## Error handling rules

1. **Catch specifically** — `catch (err)` is acceptable only if you log or handle every error type the same way. Prefer checking error properties to differentiate.
2. **Never catch and return a fake success** — returning `{ success: true }` from a failed operation is a lie. Let it throw or return `{ success: false, error: msg }`.
3. **Always log** — every `catch` block should at minimum log the error. Silent failures are bugs.
4. **Retry transient failures** — network errors and 5xx are retryable. 4xx and parse errors are not.

```javascript
// GOOD: specific catch with logging
try {
  const data = await fetch(url);
  return await data.arrayBuffer();
} catch (err) {
  logError(`Fetch failed for ${url}: ${err.message}`);
  throw err; // Re-throw — caller decides what to do
}
```

## No dead code

Before shipping, check for:

- **Commented-out code**: delete it. Version control exists.
- **Unused variables**: linters catch these, but also check manually for variables that are written but never read.
- **Unused functions**: if nothing calls a function, remove it.
- **Orphaned CSS**: if a CSS class has no matching HTML/JS, remove it.
- **Orphaned HTML elements**: if an element's ID is never referenced in JS, remove it.
- **Console.log statements used for debugging**: remove before delivery.

## Config objects over scattered state

When a module has 3+ related state variables, group them into a config object or state object:

```javascript
// BAD
let queueItems = [];
let queueStatus = 'idle';
let queueIndex = 0;
let completedCount = 0;
let failedCount = 0;

// GOOD
const state = {
  queue: [],
  status: 'idle',   // 'idle' | 'downloading' | 'paused'
  index: 0,
  completed: 0,
  failed: 0
};
```

## Avoid mutation where practical

When processing arrays, prefer creating new arrays over mutating:

```javascript
// BAD
const items = getAllItems();
for (const item of items) {
  if (item.invalid) items.splice(i, 1); // Mutating while iterating
}

// GOOD
const items = getAllItems();
const validItems = items.filter(item => item.valid);
```

Exception: de-duplication sets (`Set`) are fine to mutate — that's their purpose.

## Self-documenting conditionals

Complex conditions should be extracted into named functions:

```javascript
// BAD
if (img.naturalWidth > 180 && img.naturalHeight > 180 && !url.includes('emoji')) {
  // ...
}

// GOOD
const isDownloadableImage = (img, url) => {
  const isLargeEnough = (img.naturalWidth || img.width) > 180;
  const isNotResource = !url.includes('emoji') && !url.includes('rsrc');
  return isLargeEnough && isNotResource;
};

if (isDownloadableImage(img, url)) {
  // ...
}
```

## Module organization

For each extension file, organize code in this order:

1. **Constants** — all named constants
2. **State** — module-level variables
3. **Pure helpers** — functions with no side effects
4. **DOM interaction** — functions that touch the DOM or chrome.* APIs
5. **Event handlers** — message listeners, button click handlers, observers
6. **Init** — `init()` or equivalent called at the bottom

This reading order matches dependency order — readers see definitions before usages.

## Naming conventions by context

| Context | Convention | Example |
|---------|-----------|---------|
| Module-level constants | `SCREAMING_SNAKE_CASE` | `SCROLL_INTERVAL_MS` |
| Functions | `camelCase` verb phrases | `scanPageMedia()` |
| Variables | `camelCase` nouns | `mediaItems` |
| Message types | `SCREAMING_SNAKE_CASE` strings | `'START_DOWNLOAD'` |
| CSS class names | `kebab-case` | `media-item`, `footer-dual-actions` |
| HTML element IDs | `kebab-case` | `btn-scroll-scan`, `media-items-grid` |

## Prefer built-in APIs over new dependencies

Before adding an npm package (or another JS library), check:

- Can you use `chrome.storage.local` instead of a state management library?
- Can you use a native `MutationObserver` instead of a mutation-detection library?
- Can you use `fetch` instead of an HTTP client library?
- Can you use native `TextEncoder` / `DataView` instead of a binary-packing library?

A new dependency is permanent maintenance burden and a supply-chain surface. Add one only when it owns real complexity you should not re-implement (cryptography, ZIP parsing, time zone logic).
