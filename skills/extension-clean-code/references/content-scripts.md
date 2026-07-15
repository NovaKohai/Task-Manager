# Content scripts — deep reference

## DOM scraping strategies

### Single-pass extraction

Traverse the DOM once per scan and collect all items of interest. Avoid multiple independent queries that repeat the same work.

```javascript
const scanPage = () => {
  const items = [];
  const seen = new Set();

  // One pass: extract from targeted links
  const links = document.querySelectorAll('a[href*="/photo"]');
  for (const link of links) {
    const img = link.querySelector('img');
    if (!img) continue;
    const url = getImageUrl(img);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    items.push({ url, type: 'photo' });
  }

  // Only fall through to broad scan if targeted pass found nothing
  if (items.length === 0) {
    // Second pass: broad scan
    for (const img of document.querySelectorAll('img')) {
      // ...
    }
  }

  return items;
};
```

### De-duplication

Use a `Set` keyed by a stable identifier (file basename, path segment, or content hash) rather than the full URL, because CDNs often serve the same asset at multiple sizes under different URLs. This avoids duplicates from `src`, `srcset`, and data attributes all pointing to different versions of the same resource.

```javascript
const seen = new Set();
// Use the path basename as the dedup key, not the full URL
const key = url.split('/').pop().split('?')[0];
if (seen.has(key)) continue;
seen.add(key);
```

### High-resolution image resolution

Images in the DOM may have multiple sources — `src` (low-res thumbnail), `srcset` (multiple resolutions), and `data-*` attributes (high-res). Try them in order:

```javascript
const getHighResUrl = (img) => {
  // 1. Data attributes are safest (explicit high-res)
  for (const attr of ['data-ploi', 'data-original', 'data-src']) {
    const val = img.getAttribute(attr);
    if (val) return val;
  }

  // 2. Parent anchor's data attributes
  const parent = img.closest('a');
  if (parent) {
    const explicit = extractDataAttr(parent);
    if (explicit) return explicit;
  }

  // 3. Best from srcset
  const fromSrcset = pickBestSrcset(img.getAttribute('srcset'));
  if (fromSrcset) return fromSrcset;

  // 4. Fall back to src
  return img.src;
};
```

### MutationObserver for SPA navigation

Single-page apps (like Facebook) change the URL and content without a full page load. Use a `MutationObserver` on a stable element (like `<title>`) to detect navigation:

```javascript
let lastUrl = location.href;
const titleEl = document.querySelector('title');
if (titleEl) {
  const observer = new MutationObserver(() => {
    const current = location.href;
    if (current !== lastUrl) {
      lastUrl = current;
      onUrlChange();
    }
  });
  observer.observe(titleEl, { childList: true });
}
```

This is far more efficient than polling `location.href` on an interval. Only observe what you need — observe `titleEl` (one node), not `document.body`.

### When to use setInterval instead

Only fall back to polling when:
- There is no stable DOM element to observe.
- You need to detect a state change that doesn't mutate the DOM (e.g., computed style changes).
- You're implementing a scroll-and-scan loop (where the scanning itself drives the interval, not DOM changes).

## UI overlay injection

### Structure

Inject a container element with a unique ID. Use `document.createElement` and append to `document.body`. Always remove the overlay and its associated `<style>` element when done.

```javascript
const OVERLAY_ID = 'my-extension-overlay';
const STYLE_ID = 'my-extension-style';

const createOverlay = () => {
  if (document.getElementById(OVERLAY_ID)) return; // Don't duplicate

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  // ... populate ...

  document.body.appendChild(overlay);
};

const removeOverlay = () => {
  const el = document.getElementById(OVERLAY_ID);
  if (el) el.remove();
  const style = document.getElementById(STYLE_ID);
  if (style) style.remove();
};
```

### Animation rules

- Use `@keyframes` defined in an injected `<style>` element, not inline on each element.
- Always provide a `@media (prefers-reduced-motion: reduce)` override that disables animations.
- Use `transform` and `opacity` for animations — they are GPU-accelerated and don't trigger layout.
- Keep animation durations short (300-400ms for UI elements, under 2s for indicators).

### Accessibility

- Set `role` on interactive overlays (`role="alert"` for status, `role="dialog"` for modals).
- Make buttons keyboard-accessible with `tabIndex="0"` (or use `<button>` elements which are natively focusable).
- Listen for `keydown` events on focusable elements to handle Space/Enter.
- Use `aria-label` on icon-only buttons.

## CDN URL resolution

CDN URLs often embed size segments (`/s320x320/`, `/c0.0.640.640/`, `/p206x206/`). When you need a larger version:

- **For signed URLs** (containing query parameters like `oh=` or `oe=`): replace the size segment but preserve the signature. The signature typically covers the domain and path structure, not the exact size.
- **For unsigned URLs**: remove size segments entirely to get the original.

```javascript
const upscaleImageUrl = (url) => {
  if (!url) return url;

  // Signed URLs: keep signature, bump size
  if (/[?&](oh|oe)=/.test(url)) {
    return url.replace(/\/[a-z]?\d+x\d+\//gi, '/s960x960/');
  }

  // Unsigned URLs: remove size segments entirely
  let cleaned = url.replace(/\/[a-z]?\d+x\d+\//gi, '/');
  cleaned = cleaned.replace(/\/c\d+(\.\d+)+\//gi, '/');
  return cleaned;
};
```

Always filter out non-content URLs (icons, emoji, shared resources, tracking pixels) before processing:

```javascript
const isContentUrl = (url) => {
  return url && (url.startsWith('http://') || url.startsWith('https://'));
};
```
