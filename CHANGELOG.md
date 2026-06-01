# Wordle Buddy - Changelog

All notable changes to this project are documented here.

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
