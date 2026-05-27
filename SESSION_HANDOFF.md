# Wordle Buddy - Session Handoff Document

## Project Status: ✅ FULLY FUNCTIONAL

The extension is complete and working perfectly. All core features are implemented and tested.

## Project Location
`/Users/corey/Documents/Categories/Projects/extensions/wordle-buddy/`

## What This Extension Does

Wordle Buddy is a Chrome extension that helps users solve Wordle puzzles of any length (4-7 letters) by:
1. Tracking constraints from guesses (Greens/Yellows/Grays)
2. Generating all valid permutations that satisfy those constraints
3. Providing a notes area for the user to jot down word ideas

**Key Design Principle**: The extension shows possibilities but doesn't solve the puzzle for the user.

## Current Feature Set

### ✅ Implemented and Working
- Variable word length detection (4-7 letters)
- Permutation generation using layered constraint approach
- Correct handling of repeated letters (follows Wordle's exact rules)
- User notes area (persists between guesses)
- Excluded letters display (sorted alphabetically)
- Collapsible constraint details
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

## Architecture Overview

```
wordle-buddy/
├── manifest.json              # Extension configuration
├── content.js                 # Main coordinator, UI updates
├── gameAdapter.js             # Reads Wordle DOM, detects word length
├── permutationEngine.js       # Core constraint logic (THE BRAIN)
├── panel.html                 # UI structure
├── content.css                # Styling
├── popup.html                 # Extension popup
└── icon*.png                  # Extension icons
```

## Core Algorithm - The Layered Approach

### Layer 1: Greens (🟩)
- Letters confirmed in correct positions
- Stored as: `greens[position] = letter`
- Example: `greens[2] = 'E'` means position 3 has letter E

### Layer 2: Yellows (🟨)
- Letters confirmed present but wrong positions
- Stored as: `yellows[letter] = {maxKnown, count, invalidPositions}`
- **maxKnown**: Maximum occurrences seen across all guesses
- **count**: maxKnown - greensCount (how many still need placement)
- **invalidPositions**: Set of positions where this letter can't go

### Layer 3: Grays (⬜)
- Letters confirmed absent from word
- Stored as: `grays` Set

### Critical Algorithm: maxKnown Pattern

**Problem**: When yellows become greens in later guesses, we need to update the yellow count.

**Solution**: Track the maximum known occurrences across ALL guesses, then subtract greens.

```javascript
// For each guess with letter E:
yellows[E].maxKnown = Math.max(yellows[E].maxKnown, knownCount);

// If we see grays, we know EXACT count:
if (absentCount > 0) {
  yellows[E].maxKnown = knownCount;
}

// After all guesses processed, calculate yellows needed:
yellows[E].count = yellows[E].maxKnown - greensCount;
```

**Example** (Answer: THEME):
- After EERIE: knownCount=2, greens=1, maxKnown=2, count=2-1=1 ✓
- After SCENE: knownCount=2, greens=2, maxKnown=2, count=2-2=0 ✓

This ensures yellows that become greens don't get double-counted.

## Wordle's Repeated Letter Rules

The extension correctly implements Wordle's rules:

**Rule**: If a word has N copies of a letter, and you guess M copies:
- All correct positions marked green
- Remaining guessed letters marked yellow until total greens+yellows = N
- Any additional guessed copies marked gray

**Example**: Answer "THEME" (2 E's), Guess "EERIE" (3 E's)
1. Position 4: E is correct → Green
2. Position 0: E exists (2nd E) → Yellow
3. Position 1: E would be 3rd, but only 2 exist → Gray

Result: [Yellow, Gray, Gray, Gray, Green]

## File-by-File Breakdown

### manifest.json
- Standard Chrome extension v3 manifest
- Key sections:
  - `content_scripts.matches`: URLs where extension runs
  - `content_scripts.exclude_matches`: Archive page excluded
  - `host_permissions`: Required for NYT domains
  - `web_accessible_resources`: panel.html

### permutationEngine.js - THE CORE LOGIC

**Class**: `PermutationEngine`

**Key Methods**:
```javascript
setWordLength(length)           // Set word length (4-7)
processGuess(word, evaluations) // Process one guess
generatePermutations()          // Generate all valid patterns
getSummary()                    // Get constraint summary for display
```

**Internal State**:
- `wordLength`: Current puzzle length
- `greens`: {position -> letter}
- `yellows`: {letter -> {maxKnown, count, invalidPositions}}
- `grays`: Set of absent letters

**Critical Section**: `processGuess()` lines 30-70
- Counts letter occurrences by evaluation type
- Updates maxKnown using Math.max across guesses
- If grays exist, sets EXACT count (not max)
- Calculates yellows.count = maxKnown - greensCount

### gameAdapter.js

**Class**: `WordleGameAdapter`

**Key Methods**:
```javascript
detectWordLength()    // Counts tiles in first row
readGameState()       // Returns {wordLength, completedGuesses}
isGameReady()         // Checks if game board exists
```

**Selectors**: Uses multiple fallback selectors for rows/tiles
- Flexible to handle NYT's CSS changes
- Works across different Wordle versions

### content.js

**Main Flow**:
1. Initialize on page load
2. Wait for game ready (splash screen detection)
3. Inject panel
4. Monitor game state changes (MutationObserver)
5. Process guesses → update UI

**Key Functions**:
- `handleGameStateUpdate()`: Main update loop
- `updatePermutationsDisplay()`: Shows permutations + excluded letters
- `updateConstraintsDisplay()`: Shows greens/yellows/grays details

**Notes Persistence**: Uses `chrome.storage.local` to save user notes

### panel.html

**Structure** (top to bottom):
1. Possible Permutations (main focus)
2. Your Notes (user text area)
3. Constraint Details (collapsible)
4. Status (hidden when empty)

**Removed Features**:
- Word length badge (was at top, removed for cleaner UI)

### content.css

**Key Classes**:
- `.permutation-item`: Monospace, vertical list, large font
- `.notes-area`: Resizable textarea
- `.collapsible-content`: Constraint details (default collapsed)
- `#status-section`: Hidden when empty (display: none)

## Testing the Extension

### Load Extension
1. `brave://extensions/`
2. Enable Developer mode
3. Load unpacked → select `wordle-buddy` folder
4. Icons required (run icon creation script if missing)

### Test Scenarios

**Scenario 1: Basic 5-letter (THEME puzzle)**
- Guess EERIE → should show 3 permutations
- Guess SCENE → should show 1 permutation: `__e_e`

**Scenario 2: Variable length**
- Create 4, 6, or 7-letter custom puzzle
- Verify detection and permutations work correctly

**Scenario 3: Repeated letters**
- Any word with doubled letters
- Verify counts are exact, not over-counting

## Known Edge Cases (All Handled)

1. **Yellows becoming greens**: maxKnown algorithm handles this
2. **Repeated letters with grays**: Exact count detection works
3. **Variable word length**: Auto-detected from DOM
4. **Splash screen**: Panel waits for "Play" button click
5. **Archive page**: Excluded via manifest

## Common Issues & Solutions

**Issue**: Permutations show too many letters
**Solution**: Check `yellows[letter].count` calculation in `processGuess()`

**Issue**: Panel doesn't appear
**Solution**: User needs to click "Play" on splash screen

**Issue**: Wrong word length
**Solution**: Refresh page after puzzle loads

## Development Notes

### Debugging
- Console logs at each major step
- `console.log('Wordle Buddy content script loaded')` on init
- Check console for "Detected word length: X"

### Making Changes
1. Edit files in `/Users/corey/Documents/Categories/Projects/extensions/wordle-buddy/`
2. Go to `brave://extensions/`
3. Click refresh icon (⟳) on Wordle Buddy
4. Reload Wordle page to test

### Code Style
- Clean, commented code
- Descriptive variable names
- Functions ~20 lines max
- Comments explain WHY, not WHAT

## User Preferences

**Hugh's Working Style**:
- ADHD-friendly: iterative, test-driven development
- Values: accuracy over speed, truth over flattery
- Appreciates: direct feedback, honest critique
- Prefers: working examples, concrete test cases

**Communication Style**:
- Be an expert, be accurate
- Challenge assumptions
- Admit uncertainty clearly
- No sycophancy or hollow validation

## Future Enhancement Ideas (Not Implemented)

These are possibilities for future sessions:

1. **Word suggestions from dictionary**
   - Would require word list for each length
   - Could filter permutations to real words
   - Adds complexity, might reduce user agency

2. **Statistics tracking**
   - Average guesses to solve
   - Success rate
   - Streaks

3. **Export/import notes**
   - Save notes to file
   - Share strategies

4. **Keyboard shortcuts**
   - Quick collapse/expand
   - Focus notes area

5. **Dark mode**
   - Match Wordle's dark theme option

6. **Settings page**
   - Configure panel position (left/right)
   - Customize colors
   - Font size adjustments

## Session Initialization Statement

For a new Claude session to take over this project, use this initialization:

---

**SESSION INITIALIZATION**

I'm working on a Chrome extension called "Wordle Buddy" located at `/Users/corey/Documents/Categories/Projects/extensions/wordle-buddy/`.

The extension is a **fully functional** MVP.
It generates permutations for Wordle puzzles of any length (4-7 letters) using a layered Green/Yellow/Gray constraint approach.
The core algorithm correctly handles repeated letters using a "maxKnown" pattern where we track the maximum known occurrences across all guesses, then subtract greens to get yellows.

Please read the SESSION_HANDOFF.md and DESIGN.md files for complete context.
The extension is working perfectly - any changes should be incremental improvements or new features.

Key context:
- User is Hugh (ADHD, prefers iterative development, values accuracy)
- Core algorithm is in `permutationEngine.js` (especially the `processGuess()` method)
- All features are tested and working
- Code is clean and well-documented

I need help with: [state your specific request here]

---

## File Manifest

All files in `/Users/corey/Documents/Categories/Projects/extensions/wordle-buddy/`:

**Required Files** (extension won't load without these):
- manifest.json
- content.js
- gameAdapter.js
- permutationEngine.js
- panel.html
- content.css
- popup.html
- icon16.png
- icon48.png
- icon128.png

**Documentation Files**:
- README.md (user-facing documentation)
- SETUP.md (installation guide)
- SESSION_HANDOFF.md (this file)

## Version History

**v1.0.0** (Current) - May 15, 2026
- Initial release
- Variable word length support
- Correct repeated letter handling
- User notes area
- Excluded letters display
- Clean, minimal UI

## Success Metrics

The extension is considered successful if:
✅ Permutations are mathematically correct
✅ Repeated letters handled per Wordle rules
✅ Works on 4-7 letter puzzles
✅ UI is clean and unobtrusive
✅ Notes persist between guesses

All metrics currently met.

## Contact & Feedback

User: Hugh (Corey)
Testing on: Brave browser (Chromium-based)
Primary use: NYT Wordle custom puzzles

---

**End of Handoff Document**

This extension is tested and working.
Future sessions should focus on enhancements or bug fixes as they arise.
The core algorithm is solid and should not need modification unless Wordle's rules change.
