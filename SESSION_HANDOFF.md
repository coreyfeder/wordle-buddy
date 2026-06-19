# Wordle Buddy - Session Handoff Document

## Project Status: ✅ FULLY FUNCTIONAL — v1.4.0

The extension is complete and working. All core features are implemented and tested.
Future sessions should focus on enhancements or bug fixes as they arise.

## Project Location
`/Users/corey/Documents/Categories/Projects/extensions/wordle-buddy/`

> **Note**: Ignore the `archive/` subdirectory. It contains old session-init files and is not part of the active project.

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
- Game-status banners — won / lost / one-answer-left, styled per state; the answer stays hidden when solved to preserve satisfaction
- User notes area (persists between guesses and page reloads)
- Excluded letters display (sorted alphabetically)
- Collapsible constraint details
- Draggable panel (drag by header; position saved and restored; clamped to viewport)
- Resizable panel (size saved and restored; clamped to viewport; visible resize handle)
- Settings page (`options.html` / `options.js`) — fully functional: loads/saves via `chrome.storage.local`, with live panel updates via `chrome.storage.onChanged`
- Panel injection deferred until the game board is ready (MutationObserver; no splash-screen flash)
- Works on:
  - Regular Wordle: `https://www.nytimes.com/games/wordle/*`
  - Custom puzzles: `https://www.nytimes.com/games/create/wordle/*`
  - Archived games (specific dates)
  - Excludes: `https://www.nytimes.com/games/wordle/archive` (listing page)

### ❌ Intentionally NOT Included
- Default starting words (word-length dependent)
- Second word suggestions (word-length dependent)
- Word dictionary / auto-solve
- Letter frequency analysis

---

## Architecture

```
wordle-buddy/
├── manifest.json          # Extension config (v1.4.0)
├── content.js             # Main coordinator, UI updates, drag logic
├── gameAdapter.js         # Reads Wordle DOM, detects word length
├── permutationEngine.js   # Core constraint logic (THE BRAIN)
├── panel.html             # Injected panel UI structure
├── content.css            # Panel styling
├── popup.html             # Extension toolbar popup
├── options.html           # Settings page UI
├── options.js             # Settings page logic (loads/saves via chrome.storage.local)
├── icon*.png              # Extension icons
├── CHANGELOG.md           # Version history
└── archive/               # Old session files — ignore
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
readGameState()     // Returns {wordLength, completedGuesses, totalRows}
isGameReady()       // Checks if game board exists and has tiles
```

Uses multiple fallback selectors to handle NYT CSS changes. Tile evaluation read from `data-state` attribute, with class-based fallback.

### `content.js`

**Main Flow**:
1. Initialize on page load
2. A `MutationObserver` watches silently for the game board (no polling)
3. Inject panel from `panel.html` once the game is ready
4. Monitor game-state changes via `MutationObserver` on `data-state` / `class` (zero polling loops)
5. On state change: reset engine, reprocess all guesses, update UI

**Key Functions**:
- `handleGameStateUpdate()`: Main update loop
- `updatePermutationsDisplay()`: Shows permutations, the game-status banner, and excluded letters
- `updateConstraintsDisplay()`: Shows greens/yellows/grays detail
- `setupDragging()`: Mouse-based drag with position save/restore, clamped to viewport
- `chrome.storage.onChanged` listener: applies settings changes to the open panel live (no reload)
- `ResizeObserver` (300ms debounce): persists panel size to `panelSize`

**Storage keys used**:
- `userNotes`: string
- `panelPosition`: `{x, y}`
- `panelSize`: `{width, height}`
- `settings`: settings object (read and written by the options page)

### `panel.html`

**Structure** (top to bottom):
1. Panel header (drag handle, minimize button, settings button ⚙️)
2. Game-status banner (above the permutations box; shown only in won / lost / one-answer states)
3. Possible Permutations
4. Your Notes (textarea, expands to fill remaining space)
5. Constraint Details (collapsible)

**Note**: The in-panel settings overlay was removed in v1.3.0; settings now live entirely on the options page.

### `options.html` / `options.js`

- `options.html`: Settings page UI. Wired into manifest as `options_page`.
- `options.js`: Loads/saves all settings via `chrome.storage.local`, drives the live typography preview, auto-saves on change, and handles Reset to Defaults.

### `content.css`

- `.permutation-item`: Compact monospace display
- `.notes-area`: Resizable textarea (panel itself handles outer resize)
- `.collapsible-content`: Constraint details, collapsed by default
- Game-status banner: per-state styling (green / gray / amber)
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

### Console Messages

Exact logging has shifted across versions — the “Buddy active!” status flash and the splash-screen waiting loop were removed in v1.3.0. Expect messages around script load, panel injection, detected word length, and game-ready.

---

## Known Edge Cases (All Handled)

1. **Yellows becoming greens**: maxKnown algorithm handles this
2. **Repeated letters with grays**: Exact count detection via `absentCount > 0`
3. **Gray letter in specific position with yellows elsewhere**: `invalidPositions` now includes absent positions
4. **Variable word length**: Auto-detected from DOM on each state update
5. **Splash screen**: Panel injection deferred until the game board appears (`MutationObserver`); no splash-screen flash
6. **Archive listing page**: Excluded via manifest `exclude_matches`

---

## Settings System

Fully implemented as of v1.3.0.

| Location | Role |
|----------|------|
| `options.html` | Settings page UI |
| `options.js` | Loads/saves all settings via `chrome.storage.local`; live typography preview; auto-save with a “✓ Saved” indicator; Reset to Defaults |
| `content.js` → `chrome.storage.onChanged` listener | Applies changes to the open panel immediately (no reload) |
| `chrome.storage.local` key `settings` | Read and written by the options page |

Controls: colour scheme (Auto / Light / Dark), show/hide headers and constraint details, and independent font / size / bold for permutations and notes. The zoom control was removed in v1.3.0 in favour of explicit font sizes plus the resizable panel.

---

## Roadmap

Supersedes the earlier "Future Enhancement Ideas." Living list — expect it to change as features are scoped and built.

### Foundational

- **Settings page completion** (`options.js`) — prerequisite for every option-based feature below. Opacity, all-caps, and colorblind toggles all read/write `chrome.storage.local` through the settings page.

### Planned

**Accessibility** — mirror NYT's semantic labels and ARIA schema wherever possible. Inspect the live game DOM at implementation time; NYT's markup changes. Validation requires testing with a real screen reader (NVDA on Windows, VoiceOver on Mac) — spec compliance is not the same as a good spoken experience. Subunits:
- State not conveyed by color alone (WCAG 1.4.1) — every green/yellow/gray also exposed as text for assistive tech. Source state is already available via `gameAdapter` reading `data-state`.
- Colorblind / high-contrast palette — pairs with existing light/dark mode; match NYT's orange-blue scheme.
- Keyboard operability of all controls (WCAG 2.1.1) — collapse/settings as real buttons (Enter/Space); a keyboard path to move/reset the panel (drag and corner-resize are currently pointer-only). The roll-up already serves as a keyboard-friendly "get it out of the way."
- One polite live region (`aria-live="polite"`) announcing a terse summary ("3 possibilities") on update — never the full permutation list, which is unusable read aloud.
- Honor OS preferences — `prefers-color-scheme`, `prefers-reduced-motion`; `prefers-contrast` as progressive enhancement. Confirm layout survives 200% zoom (WCAG 1.4.10).
- Landmark + headings — panel as `role="complementary"` with `aria-label`; real headings per section. Don't steal focus on inject.
- Open question: whether to remap blank slots (`_`) to a spoken word rather than letting the screen reader say "underscore."

**Panel opacity**
- Static opacity-floor slider in settings (CSS `opacity`; reliable everywhere) plus an on/off switch.
- In-page hover behavior: reduced opacity at rest, full on `mouseenter`, fade on `mouseleave` (optional mousemove-idle timer).
- Explicitly NOT tracking cross-window / cross-app focus — those signals don't cleanly disambiguate and vary by OS and window manager.

**Notes all-caps option**
- Toggle to render the Notes area in all caps; default **on**.
- Open question: visual `text-transform: uppercase` (cheapest, reversible, but copied text keeps original case) vs. transforming input on keystroke (changes the stored value).

**Click-to-dismiss permutations**
- Click a permutation to toggle it "unlikely"; gray it out rather than hide, so it stays visible to un-flag.
- Purely a user-judgment overlay — does not change engine constraints. Stays in-spirit: organizes the user's reasoning, injects no knowledge.
- v1: dismiss the exact pattern. Store dismissed patterns by pattern string in `chrome.storage.local`; reapply on each regeneration, since the list is rebuilt after every guess.
- v2 (bigger lift): subsumption — auto-dismiss any later permutation that refines a dismissed pattern (every non-blank position of the dismissed pattern matches).
- Open questions: scope dismissals to the current puzzle and clear them on board/word reset (otherwise stale flags leak across days); whether to prune flags whose pattern is no longer generated.

### Considered and declined

- **Word/answer suggestions, dictionary filtering, letter-frequency analysis** — injects knowledge the player doesn't have; violates the core "show possibilities, don't solve it" principle.
- **Repeated-letter "appears ≥N times" indicator** — redundant; every generated permutation already shows the forced repeat in valid positions.
- **Yellow-letter "not-here" position grid** — information overload for a slender panel.
- **Confirmed-letter position display** — NYT's own board already covers this well.
- **Permutation-reduction timeline / stat** — misleading: permutation count is not monotonically decreasing (adding a yellow with multiple valid positions increases it).
- **Solve journal / history** — out of scope: multi-user storage, unbounded growth, and local-vs-account confusion outweigh current demand.

---

## User Preferences

**Hugh's Working Style**:
- Iterative, test-driven development
- Values accuracy over speed, truth over flattery
- Prefers direct feedback, concrete examples, honest critique
- No sycophancy or hollow validation

**Testing on**: Brave browser (Chromium-based)
**Primary use**: NYT Wordle custom puzzles
