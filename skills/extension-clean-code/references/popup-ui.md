# Popup UI — deep reference

## Lifecycle

The popup lives only while the user views it. When it opens:
1. Load settings from `chrome.storage.local`.
2. Query the active tab to determine if the content script is available.
3. Request initial state from the service worker (`GET_STATUS`).
4. If a download is already in progress, show the progress UI immediately.

When it closes, all state is lost. There are no `beforeunload` events in popups.

## Settings persistence pattern

```javascript
const loadSettings = () => {
  chrome.storage.local.get({
    quality: 'high',
    asZip: true,
    delay: 1500
  }, (items) => {
    settingQuality.value = items.quality;
    settingZip.checked = items.asZip;
    // ...
  });
};

const saveSettings = () => {
  const settings = {
    quality: settingQuality.value,
    asZip: settingZip.checked,
    delay: parseInt(settingDelay.value)
  };
  chrome.storage.local.set(settings, () => {
    showSavedFeedback();
  });
};
```

Default values in `chrome.storage.local.get()` serve as the single source of truth for defaults.

## Tab navigation

Use `data-tab` attributes to match buttons to content sections:

```html
<button class="tab-btn active" data-tab="tab-scraper">Scan</button>
<button class="tab-btn" data-tab="tab-settings">Settings</button>

<section id="tab-scraper" class="tab-content active">...</section>
<section id="tab-settings" class="tab-content">...</section>
```

```javascript
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});
```

## Polling pattern

Since the popup is ephemeral, it should poll the service worker on open to sync state:

```javascript
const init = () => {
  loadSettings();
  connectToTab();

  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    if (response) {
      updateQueueUI(response);
    }
  });
};
```

## Accessibility checklist

Every interactive element in the popup must pass:

- [ ] Focusable via `Tab` — use `<button>`, `<a>`, `<input>`, `<select>` natively, or add `tabIndex`.
- [ ] Visible focus indicator via `:focus-visible`.
- [ ] Keyboard activation — button `click` handlers fire on Enter/Space automatically for native elements.
- [ ] ARIA roles — `role="checkbox"` for selection cards, `role="alert"` for status updates, `aria-checked` for toggle state.
- [ ] `aria-label` on icon-only buttons.
- [ ] Color contrast — text on background meets WCAG AA (4.5:1 for normal text, 3:1 for large).
- [ ] `prefers-reduced-motion: reduce` — disable all animations.

## Grid rendering

When rendering a grid of items from a data array:

```javascript
const renderGrid = (items) => {
  if (items.length === 0) {
    grid.innerHTML = '<div class="empty-state">No items found</div>';
    return;
  }

  grid.innerHTML = '';
  items.forEach((item, index) => {
    const card = createCard(item, index);
    grid.appendChild(card);
  });
  updateSummary();
};
```

Each card should be independently created by a helper function for clarity.
