# Wordle Buddy - Session Handoff Document

## Project Status: ✅ FULLY FUNCTIONAL — v1.2.0

The extension is complete and working. All core features are implemented and tested.
Future sessions should focus on enhancements or bug fixes as they arise.

## Project Location
`/Users/corey/Documents/Categories/Projects/extensions/wordle-buddy/`

> **Note**: Ignore the `_archive/` subdirectory. It contains old session-init files and is not part of the active project.

---

## What This Extension Does

Wordle Buddy is a Chrome extension that helps users solve Wordle puzzles of any length (4–7 letters) by:
1. Tracking constraints from guesses (Greens / Yellows / Grays)
2. Generating all valid permutations that satisfy those constraints
3. Providing a notes area for the user to jot down word ideas

**Key Design Principle**: The extension shows possibilities but doesn't solve the puzzle for the user.

---

## Current Feature Set

### ✅ Implemented and Working
- Variable word length detection (4–7 letters)
- Permutation generation using layered constraint approach
- Correct handling of repeated letters (follows Wordle's exact rules)
- Victory message when only one permutation remains (hides the answer to preserve satisfaction)
- User notes area (persists between guesses and page reloads)
- Excluded letters display (sorted alphabetically)
- Collapsible constraint details
- Draggable panel (drag by header; position saved and restored)
- Resizable panel (CSS resize from bottom-right corner)
- Settings page UI (`options.html`) — **UI complete, logic not yet implemented**
- Works on:
  - Regular Wordle: `https://www.nytimes.com/games/wordle/*`
  - Custom puzzles: `https://www.nytimes.com/games/create/wordle/*`
  - Archived games (specific dates)
  - Excludes: `https://www.nytimes.com/games/wordle/archive` (listing page)

### ⚠️ Built but Not Yet Functional
- **Settings page** (`options.html` / `options.js`): The UI is fully designed and wired into the manifest. `options.js` is a stub with TODOs. Settings logic exists in `content.js` as disabled scaffolding (`setupSettings()` is defined but not called). Next step is implementing `options.js` and connecting it to `chrome.storage.local`.

### ❌ Intentionally NOT Included
- Default starting words (word-length dependent)
- Second word suggestions (word-length dependent)
- Word dictionary / auto-solve
- Letter frequency analysis

---

## Architecture

```
wordle-buddy/
├── manifest.json          # Extension config (v1.2.0)
├── content.js             # Main coordinator, UI updates, drag logic
├── gameAdapter.js         # Reads Wordle DOM, detects word length
├── permutationEngine.js   # Core constraint logic (THE BRAIN)
├── panel.html             # Injected panel UI structure
├── content.css            # Panel styling
├── popup.html             # Extension toolbar popup
├── options.html           # Settings page UI (functional UI, stub logic)
├── options.js             # Settings page logic (STUB — not yet implemented)
├── icon*.png              # Extension icons
├── CHANGELOG.md           # Version history
└── _archive/              # Old session files — ignore
```

---

## Core Algorithm — The Layered Approach

### Layer 1: Greens 🟩
- Letters confirmed in correct positions
- Stored as: `greens[position] = letter`
- Example: `greens[2] = 'E'` means position 3 (0-indexed) has letter E

### Layer 2: Yellows 🟨
- Letters confirmed present but in wrong positions
- Stored as: `yellows[letter] = {maxKnown, count, invalidPositions}`
  - **maxKnown**: Maximum total occurrences seen across all guesses
  - **count**: `maxKnown - greensCount` (how many still need placement)
  - **invalidPositions**: Set of positions where this letter cannot go (from both `present` and `absent` evaluations)

### Layer 3: Grays ⬜
- Letters confirmed absent from word
- Stored as: `grays` Set

### Critical Algorithm: maxKnown Pattern

**Problem**: When yellows become greens in later guesses, the yellow count must update.

**Solution**: Track the maximum known occurrences across ALL guesses, then subtract greens.

```javascript
// Track max occurrences seen across all guesses
yellows[E].maxKnown = Math.max(yellows[E].maxKnown, knownCount);

// If grays exist for this letter, we know the EXACT total count
if (absentCount > 0) {
  yellows[E].maxKnown = knownCount;
}

// Recalculate after every guess
yellows[E].count = yellows[E].maxKnown - greensCount;
```

**Example** (Answer: THEME, 2 E's):
- After EERIE `[Y,-,-,-,G]`: knownCount=2, greens=1, maxKnown=2, count=1 ✓
- After SCENE `[-,-,G,-,G]`: knownCount=2, greens=2, maxKnown=2, count=0 ✓

### Critical Fix: Invalid Positions from Absent Evaluations

`invalidPositions` must include positions from **both** `present` and `absent` evaluations. If a letter appears gray in a specific position but exists elsewhere in the word, that position is still invalid for that letter.

```javascript
occurrences.present.forEach(pos => {
  this.yellows[letter].invalidPositions.add(pos);
});
occurrences.absent.forEach(pos => {
  this.yellows[letter].invalidPositions.add(pos);
});
```

Without this, permutations incorrectly place letters at gray positions.
(Bug example: Answer NEWLY, guess ELEGY — E at position 3 is gray but was appearing in permutations.)

---

## Wordle's Repeated Letter Rules

**Rule**: If a word has N copies of a letter and you guess M copies:
- Correct positions → Green
- Remaining copies (up to N total) → Yellow
- Any excess copies → Gray

**Example**: Answer "THEME" (2 E's), Guess "EERIE" (3 E's):
1. Position 4: E correct → Green
2. Position 0: E present (2nd E in answer) → Yellow
3. Position 1: E would be 3rd, but only 2 exist → Gray

Result: `[Yellow, Gray, Gray, Gray, Green]`

---

## File-by-File Breakdown

### `permutationEngine.js` — THE CORE LOGIC

**Class**: `PermutationEngine`

**Key Methods**:
```javascript
setWordLength(length)           // Set word length (4–7); resets state
processGuess(word, evaluations) // Process one guess; updates all constraints
generatePermutations()          // Generate all valid patterns
getSummary()                    // Get constraint summary for display
```

**Internal State**:
- `wordLength`: Current puzzle length
- `greens`: `{position -> letter}`
- `yellows`: `{letter -> {maxKnown, count, invalidPositions}}`
- `grays`: Set of absent letters

**Critical section**: `processGuess()` — handles maxKnown tracking, gray/present position exclusion, and count recalculation.

### `gameAdapter.js`

**Class**: `WordleGameAdapter`

**Key Methods**:
```javascript
detectWordLength()  // Counts tiles in first row; returns 4–7
readGameState()     // Returns {wordLength, completedGuesses}
isGameReady()       // Checks if game board exists and has tiles
```

Uses multiple fallback selectors to handle NYT CSS changes. Tile evaluation read from `data-state` attribute, with class-based fallback.

### `content.js`

**Main Flow**:
1. Initialize on page load
2. Wait for game ready (polls `isGameReady()` up to 60 seconds)
3. Inject panel from `panel.html`
4. Monitor game state changes via `MutationObserver` + 1s polling
5. On state change: reset engine, reprocess all guesses, update UI

**Key Functions**:
- `handleGameStateUpdate()`: Main update loop
- `updatePermutationsDisplay()`: Shows permutations, victory message, and excluded letters
- `updateConstraintsDisplay()`: Shows greens/yellows/grays detail
- `setupDragging()`: Mouse-based drag with position save/restore
- `setupSettings()`: Settings overlay wiring — **currently disabled**, called nowhere
- `applySettingToUI()`: Applies individual settings to panel DOM — **implemented but not called**

**Storage keys used**:
- `userNotes`: string
- `panelPosition`: `{x, y}`
- `settings`: settings object (written by `applySetting()`, not yet read by options page)

### `panel.html`

**Structure** (top to bottom):
1. Panel header (drag handle, minimize button, settings button ⚙️)
2. Possible Permutations
3. Your Notes (textarea, expands to fill remaining space)
4. Constraint Details (collapsible)
5. Status (hidden when empty)

**Note**: Settings button in header is present in the HTML but its click handler (`setupSettings()`) is disabled in `content.js`.

### `options.html` / `options.js`

- `options.html`: Fully designed settings page. Wired into manifest as `options_page`.
- `options.js`: Stub only. Loads, logs to console, does nothing else.
- **Next step**: Implement `loadSettings()`, `saveSettings()`, `updatePreview()` in `options.js`.

### `content.css`

- `.permutation-item`: Compact monospace display
- `.notes-area`: Resizable textarea (panel itself handles outer resize)
- `.collapsible-content`: Constraint details, collapsed by default
- `#status-section`: Hidden when empty
- Panel uses flexbox; notes section uses `flex: 1` to fill remaining height

---

## Testing

### Load Extension
1. Open `brave://extensions/`
2. Enable Developer mode
3. "Load unpacked" → select `wordle-buddy/` folder
4. Navigate to Wordle and click "Play"

### Reload After Changes
1. Edit files in the project directory
2. `brave://extensions/` → click refresh (⟳) on Wordle Buddy
3. Reload the Wordle page

### Test Scenarios

**Scenario 1: Repeated letters (THEME puzzle)**
- Guess EERIE → should show 3 permutations
- Guess SCENE → should show 1 permutation: `__e_e`
- (Victory message should appear since `__e_e` has no blanks — actually this IS fully known, so victory message fires)

**Scenario 2: Gray position exclusion (NEWLY puzzle)**
- Guess ADIEU, STORY, ELEGY
- After ELEGY: E is gray at position 3 (0-indexed: position 2)
- Verify no permutation shows E at that position

**Scenario 3: Variable length**
- Create 4, 6, or 7-letter custom puzzle at `https://www.nytimes.com/games/create/wordle/`
- Verify word length is detected correctly and permutations match

**Scenario 4: Notes persistence**
- Type notes, make a guess, verify notes survive
- Reload page, verify notes survive

**Scenario 5: Drag and resize**
- Drag panel by header, reload page, verify position restored
- Drag bottom-right corner to resize

### Console Messages (Expected)
```
Wordle Buddy content script loaded
Wordle Buddy initializing...
Panel injected
Waiting for game to be ready...
Detected word length: 5
Game is ready!
✓ Buddy active!
```

---

## Known Edge Cases (All Handled)

1. **Yellows becoming greens**: maxKnown algorithm handles this
2. **Repeated letters with grays**: Exact count detection via `absentCount > 0`
3. **Gray letter in specific position with yellows elsewhere**: `invalidPositions` now includes absent positions
4. **Variable word length**: Auto-detected from DOM on each state update
5. **Splash screen**: Panel waits for "Play" button click (polls `isGameReady()`)
6. **Archive listing page**: Excluded via manifest `exclude_matches`

---

## Settings System (Current State)

The settings system is partially built across three locations:

| Location | State |
|----------|-------|
| `options.html` | UI complete |
| `options.js` | Stub — not implemented |
| `content.js` → `setupSettings()` | Implemented but disabled |
| `content.js` → `applySettingToUI()` | Implemented but not called on load |
| `chrome.storage.local` key `settings` | Written by `applySetting()` if called; never read by options page |

To complete settings: implement `options.js` to read/write `chrome.storage.local` using the `settings` key and the default settings object defined in `content.js`.

---

## Future Enhancement Ideas

1. **Complete settings page** — implement `options.js` (highest priority unfinished item)
2. **Word suggestions from dictionary** — filter permutations to real words; requires word list per length
3. **Statistics tracking** — guess counts, success rate, streaks
4. **Export/import notes** — save notes to file, share strategies
5. **Keyboard shortcuts** — quick collapse/expand, focus notes
6. **Remember panel size** — currently only position is saved, not dimensions

---

## User Preferences

**Hugh's Working Style**:
- Iterative, test-driven development
- Values accuracy over speed, truth over flattery
- Prefers direct feedback, concrete examples, honest critique
- No sycophancy or hollow validation

**Testing on**: Brave browser (Chromium-based)
**Primary use**: NYT Wordle custom puzzles
