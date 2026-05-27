# Wordle Buddy - Quick Start

## Loading the Extension

1. Open Brave: `brave://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Navigate to: `/Users/corey/Documents/Categories/Projects/extensions/wordle-buddy`
5. Click "Select"

## Testing

### Test with Custom Puzzles

1. Go to: https://www.nytimes.com/games/create/wordle/
2. Create a custom puzzle (try 4, 5, 6, or 7 letters)
3. Click "Play" on the splash screen
4. Panel should appear on the right
5. Make guesses and watch permutations update!

### Recommended Test Cases

**Test 1: Basic 5-letter (from your examples)**
- Answer: ETHER
- Guess: EERIE
- Expected permutations: `ere__`, `e_er_`, `e_e_r`, `er_e_`, `e__er`

**Test 2: Continuation**
- After EERIE, guess: ERECT
- Expected permutations: `et_er`, `e_ter`

**Test 3: Variable Length - 4 letters**
- Create any 4-letter puzzle
- Verify permutations shows a 4-letter word
- Verify permutations work correctly

**Test 4: Variable Length - 6 or 7 letters**
- Create 6 or 7 letter puzzle
- Verify detection and permutations

**Test 5: Notes Persistence**
- Type notes in the "Your Notes" area
- Make a guess
- Verify notes remain intact
- Refresh page and verify notes persist

## What You Should See

### Panel Sections (Top to Bottom)

1. **Possible Permutations** - One pattern per line, monospace font
2. **Your Notes** - Text area for your ideas
3. **Constraint Details** - Collapsible section showing:
   - Greens: Letters in correct positions
   - Yellows: Letters present but wrong position (with counts)
   - Grays: Letters absent from word

### Console Messages

Open console (Cmd+Option+I) to see:
```
Wordle Buddy content script loaded
Wordle Buddy initializing...
Panel injected
Waiting for game to be ready...
Detected word length: 5
Game is ready!
✓ Buddy active!
```

## Troubleshooting

### "Could not load extension"
→ Icons missing! Run the Python command above

### Panel doesn't appear
→ Click "Play" on Wordle splash screen
→ Refresh the page
→ Check console for errors

### Wrong word length
→ Refresh after puzzle fully loads
→ Make sure tiles are visible

### Permutations look wrong
→ Expand "Constraint Details"
→ Verify Greens/Yellows/Grays match the game
→ Check console for any errors

## Architecture Overview

```
PermutationEngine (permutationEngine.js)
├── Layer 1: Greens (fixed positions)
├── Layer 2: Yellows (counts + invalid positions)
└── Layer 3: Grays (absent letters)

WordleGameAdapter (gameAdapter.js)
├── detectWordLength() → 4-7
└── readGameState() → {wordLength, completedGuesses}

Content Script (content.js)
├── Monitors game changes
├── Calls engine.processGuess() for each completed row
├── Updates UI with permutations
└── Persists notes to chrome.storage
```

## Key Differences from Old Extension

### ✅ What Changed
- **Variable word length**: Works with 4-7 letter puzzles
- **Simplified UI**: No default words, no second word suggestions
- **Better repeated letter handling**: Correctly implements Wordle rules
- **Notes area**: New feature for user ideas
- **Collapsible constraints**: Details hidden by default

### ❌ What's Removed
- Default starting word (word-length specific)
- Second word suggestions (word-length specific)
- "Enter default word" button
- Pattern storage (not needed without suggestions)
- Word length badge removed (UI clutter)

## Next Steps

After confirming it works:
1. Test with the specific scenarios from examples
2. Try edge cases (all one letter, all different, etc.)
3. Test different word lengths
4. Report any issues with specific guess/evaluation combos

## File Checklist

Before loading, verify these files exist:
- [ ] manifest.json
- [ ] content.js
- [ ] gameAdapter.js
- [ ] permutationEngine.js
- [ ] panel.html
- [ ] content.css
- [ ] popup.html
- [ ] icon16.png
- [ ] icon48.png
- [ ] icon128.png
- [ ] README.md
