# Wordle Buddy - Changelog

All notable changes to this project are documented here.

---

## v1.4.0 — June 3, 2026

### Bug Fixes

**Panel drag constrained to viewport**
Drag now clamps to viewport bounds so the header can never be moved off-screen. `restorePosition()` also clamps stored coordinates via `requestAnimationFrame`, so any previously saved out-of-bounds position self-corrects on next load.

**Panel resize constrained to viewport bottom**
`updateMaxHeight()` sets `maxHeight = viewport height − panel top` so the native resize handle can never push the bottom edge below the screen. Called after drag, after position restore, and on window resize.

### New Features

**Game-status messages**
Three distinct end-of-game states replace the old permutation-based message:
- *Won* (all tiles correct): "Great job!" banner, permutations hidden
- *Lost* (all rows used, not won): "Better luck next time." banner, permutations remain visible
- *Constrained* (one fully-determined permutation, still playing): "Only one possible answer now!" banner, permutations hidden — preserves the player's sense of solving it themselves

Banner is a separate element above the permutations box, styled per state (green / gray / amber).

**Reset to Defaults button**
Settings page now has a Reset to Defaults button. Overwrites only the `settings` storage key — notes, panel position, and panel size are untouched. Requires confirmation.

**Visible resize handle indicator**
`pointer-events: none` overlay with a diagonal stripe pattern makes the resize handle discoverable without interfering with the browser's native resize behaviour.

### Files Changed

| File | Change |
|------|--------|
| `manifest.json` | Version bump to 1.4.0 |
| `content.js` | Drag/resize viewport constraints; game-status detection; updated display function |
| `content.css` | Game-status banner styles; resize indicator styles |
| `gameAdapter.js` | `readGameState()` now returns `totalRows` |
| `panel.html` | Banner element added; permutations box restructured; resize indicator div |
| `options.html` | Reset to Defaults button and styles |
| `options.js` | Reset to Defaults listener |

---

## v1.3.0 — June 2, 2026

### Bug Fixes

**Dark mode: headers and permutation items now correctly light-coloured**
Both `.section h4` and `.permutation-item` have explicit CSS colour declarations that override inherited panel colour. The `colorScheme` handler now resets all inline overrides first, then applies the target theme, explicitly targeting both element types.

**Panel now rolls up when collapsed**
Previously the content hid but the panel shell stayed full height. On collapse, the panel now snapshots its current height and switches to `height: auto` (shrinking to the header only). The `ResizeObserver` ignores events while collapsed to avoid overwriting the saved expanded height.

### New Features

**Settings page fully implemented**
`options.js` now loads and saves all settings via `chrome.storage.local`. All controls are wired: colour scheme, show/hide headers and constraint details, permutation and notes font/size/bold. Typography controls update a live preview. Settings auto-save on every change with a brief “✓ Saved” indicator.

**Bold font option**
Bold toggle added for permutations and notes typography independently, reflected live in the settings preview and applied immediately to the panel.

**Live panel updates when settings change**
A `chrome.storage.onChanged` listener in `content.js` applies changes to the open panel immediately — no page reload required.

**Panel size persistence**
Panel dimensions are now saved to `chrome.storage.local` under `panelSize` and restored on load, alongside the existing position persistence. Uses a `ResizeObserver` with a 300ms debounce.

### Changes

**Panel deferred until game is active**
The panel no longer appears on the NYT splash screen. A `MutationObserver` watches silently for the game board; the panel injects and activates the moment the game is ready. Removed `showWaitingForGame()` and `showGameLoadError()` and the “Buddy active!” status flash — the panel appearing is sufficient signal.

**Zoom control removed**
The zoom slider was removed from the settings page. Explicit font size controls and a resizable panel address the same need more precisely.

**Default notes font changed to monospace**
Consistent with the fixed-length word-pattern context of the permutations display. Notes font dropdown reordered: Monospace listed first.

### Performance

**Replaced `waitForGameReady` polling with MutationObserver**
Eliminates the 500ms `setInterval` used to detect game load. The observer disconnects itself once the game is ready.

**Removed redundant `setInterval` from `startMonitoring`**
The `MutationObserver` watching `data-state` and `class` changes across the subtree catches all tile evaluations. The extension now has zero polling loops running at any point.

### Cleanup

- Renamed `_archive/` → `archive/` (Chrome rejects directory names starting with `_`)
- Removed deprecated in-panel settings overlay (panel.html, content.js, content.css)
- Removed dead status section HTML and CSS
- Added commit and documentation conventions to `QUICK_REFERENCE.md`

### Storage Keys

- `panelSize` — `{width, height}` pixel dimensions of panel *(new)*

### Files Changed

| File | Change |
|------|--------|
| `manifest.json` | Version bump to 1.3.0 |
| `content.js` | Settings listener; panel deferred; collapse fix; size persistence; polling removed; dead functions removed |
| `content.css` | Header padding reduced; dead overlay and status CSS removed |
| `options.js` | Fully implemented (was stub) |
| `options.html` | Bold checkboxes added; zoom removed; notes font reordered |
| `panel.html` | Dead status section and settings overlay removed |

---

## v1.2.0 — May 17, 2026

### Bug Fixes

**CRITICAL: Fixed permutation generation including letters in gray (absent) positions**

When a letter appeared as gray in a position but existed elsewhere in the word (as green or yellow), the permutation engine was not marking that position as invalid. This caused incorrect permutations to appear.

Example: Answer NEWLY, guesses ADIEU / STORY / ELEGY — E at position 3 in ELEGY is gray (absent), but permutations incorrectly showed patterns with E at position 3.

Fix: `processGuess()` in `permutationEngine.js` now adds absent-evaluation positions to `invalidPositions`, not just present-evaluation positions.

```javascript
// Adds invalid positions from both present AND absent evaluations
occurrences.absent.forEach(pos => {
  this.yellows[letter].invalidPositions.add(pos);
});
```

### New Features

**Victory message** — When only one permutation remains and it is fully determined (no blanks), the panel displays an encouraging message instead of revealing the answer, preserving the user's sense of accomplishment.

**Draggable panel** — The panel can be dragged by its header. Position is saved to `chrome.storage.local` and restored on page load. The cursor changes to `grabbing` during drag. The minimize button is excluded from the drag target.

**Resizable panel** — The panel supports CSS `resize: both`. Users can drag the bottom-right corner to resize. Min width: 150px, max width: 600px.

**Settings page** — A dedicated settings page (`options.html`, accessed via the extension's options link) provides UI for all display preferences. The page is wired into `manifest.json` via `"options_page": "options.html"`.

> ⚠️ **Note**: The settings page UI is complete but `options.js` is currently a stub. Settings are not yet functional. See `options.js` for TODOs.

Settings planned (UI built, logic pending):
- Zoom: 80%–150%
- Color scheme: Auto / Light / Dark
- Show/hide constraint details section
- Show/hide section headers
- Permutations font and size
- Notes font and size

Default settings object (defined in `content.js`, not yet connected to options page):
```javascript
{
  zoom: 100,
  colorScheme: 'auto',
  showDetails: true,
  showHeaders: true,
  permFont: 'monospace',
  permSize: 'medium',
  notesFont: 'sans-serif',
  notesSize: 'medium'
}
```

### UI/UX Changes

- Compact permutation display: reduced padding, lighter borders, smaller gap between items, slightly smaller font, center-aligned
- Default panel width reduced (~380px → ~180px)
- Default panel position moved closer to top and right edge
- Panel height now fills almost the full viewport: `calc(100vh - 70px)`
- Notes textarea uses `flex: 1` to fill remaining vertical space dynamically
- Panel uses flexbox layout throughout
- Header has `cursor: move` and `user-select: none`
- Settings button (⚙️) added to panel header (wired to overlay scaffolding in `content.js`; disabled pending options page completion)

### Storage Keys

- `userNotes` — user's text notes (string)
- `panelPosition` — `{x, y}` pixel coordinates of panel
- `settings` — object with all user preferences (not yet read/written by options page)

### Files Changed

| File | Change |
|------|--------|
| `manifest.json` | Version bump to 1.2.0; added `options_page` |
| `permutationEngine.js` | Bug fix: absent positions added to `invalidPositions` |
| `content.js` | Victory message; dragging logic; settings scaffolding (disabled) |
| `content.css` | Compact UI; flexbox layout |
| `panel.html` | Settings button; notes-section class |
| `options.html` | New: settings page UI (not yet functional) |
| `options.js` | New: stub (TODOs only) |

---

## v1.1.0 — May 15, 2026

Initial working release.

- Variable word length detection (4–7 letters) via DOM tile count
- Permutation generation using layered Green / Yellow / Gray constraint approach
- Correct repeated letter handling (maxKnown pattern)
- User notes area, persisted via `chrome.storage.local`
- Excluded letters display (sorted alphabetically)
- Collapsible constraint details
- Works on NYT Wordle (daily), custom puzzles, and archived games
- Archive listing page excluded via manifest

### Core Algorithm: maxKnown Pattern

Tracks the maximum known occurrences of a letter across all guesses, then subtracts confirmed greens to get the remaining yellow count. This correctly handles yellows that become greens in later guesses.

```javascript
yellows[letter].maxKnown = Math.max(yellows[letter].maxKnown, knownCount);
yellows[letter].count = yellows[letter].maxKnown - greensCount;
```

Example (answer: THEME, 2 E's):
- After EERIE: knownCount=2, greens=1, maxKnown=2, count=1 ✓
- After SCENE: knownCount=2, greens=2, maxKnown=2, count=0 ✓
