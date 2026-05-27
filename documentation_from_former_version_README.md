# Wordle Buddy

**This document seems out of date; defer to `SESSION_HANDOFF.md`.**

A focused Chrome extension for tracking constraints and generating permutations in Wordle puzzles of any length (4-7 letters).

## Features

### ✅ Core Functionality
- **Variable Word Length**: Automatically detects 4-7 letter words
- **Permutation Generation**: Shows all valid word patterns based on constraints
- **Layered Constraint Tracking**: Uses Green/Yellow/Gray terminology
- **User Notes**: Scratch area for jotting down word ideas (persists between guesses)

### 🎯 Design Philosophy
- **Permutations First**: Highest value feature gets top billing
- **Clean UI**: Only essential controls
- **No Assumptions**: Adapts to any word length
- **Minimal Processing**: Extension doesn't try to solve the puzzle for you

## Installation

1. Open `brave://extensions/` or `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `wordle-buddy` folder
5. Navigate to Wordle and play!

## How It Works

### The Layered Approach

**Layer 1 - Greens (🟩)**
- Letters confirmed in correct positions
- These don't move in permutations
- One green per position maximum

**Layer 2 - Yellows (🟨)**
- Letters confirmed present but in wrong positions
- Tracks count needed and invalid positions
- Example: If 'E' appears twice (one green, one yellow), yellows tracks 1 remaining E

**Layer 3 - Grays (⬜)**
- Letters confirmed absent from the word
- Used to eliminate possibilities

### Repeated Letter Handling

The extension correctly handles Wordle's rules for repeated letters:

**Example**: Answer is "ETHER", guess is "EERIE"
- First E: Green (correct position)
- Second E: Yellow (in word, wrong position)
- Third E: Yellow (in word, wrong position)
- Fourth E: Gray (only 3 E's in answer)
- Fifth E: Gray

Result: Greens show E at position 1, Yellows show 2 more E's needed

### Permutations

Shows ALL valid patterns that satisfy:
- All greens in place
- All yellows placed in valid positions
- No grays included

**Example 1**: "EERIE" → [Green, Yellow, Yellow, Gray, Gray]
- Permutations: `ere__`, `e_er_`, `e_e_r`, `er_e_`, `e__er`

**Example 2**: After "ERECT" → [Green, Yellow, Yellow, Gray, Yellow]
- Permutations narrow to: `et_er`, `e_ter`

## UI Guide

### Word Length Badge
- Shows detected word length (e.g., "5-letter word")
- Updates automatically based on puzzle

### Possible Permutations
- One pattern per line for easy scanning
- Underscores show unknown letters
- Shows count if > 100 permutations

### Your Notes
- Free text area for word ideas
- Persists between guesses
- Survives page reloads

### Constraint Details (Collapsible)
- Click header to expand/collapse
- Shows all Greens, Yellows, Grays
- Color-coded for easy reading

## Supported URLs

- Regular Wordle: `https://www.nytimes.com/games/wordle/*`
- Custom Puzzles: `https://www.nytimes.com/games/create/wordle/*`

## Technical Details

### Architecture

```
wordle-buddy/
├── manifest.json           # Extension configuration
├── content.js              # Main coordinator
├── gameAdapter.js          # Reads Wordle game state
├── permutationEngine.js    # Core permutation logic
├── panel.html              # UI structure
├── content.css             # Styling
└── popup.html              # Extension popup
```

### Key Classes

**PermutationEngine**
- Implements layered constraint tracking
- Handles variable word length
- Correctly processes repeated letters
- Generates all valid permutations

**WordleGameAdapter**
- Detects word length from DOM
- Reads tile states (correct/present/absent)
- Monitors game changes

## What's NOT Included

### Intentionally Omitted Features
- ❌ Default starting words (word-length dependent)
- ❌ Second word suggestions (word-length dependent)
- ❌ Word dictionary lookup
- ❌ Auto-solve functionality
- ❌ Letter frequency analysis

These features either assume 5-letter words or try to solve the puzzle for you. Wordle Buddy focuses on showing YOU the possibilities.

## Keyboard Shortcuts

- Typing in panel inputs won't affect the game
- All keypresses are isolated to prevent accidental game input

## Privacy

- No data collection
- No external API calls
- Notes stored locally in browser only
- No tracking or analytics

## Known Limitations

1. **Pattern notation edge case**: When a word has 3+ of the same letter where some are gray, the current display may not capture all nuance. The permutation engine handles this correctly internally.

2. **Very large permutation counts**: With minimal constraints, you might see 100+ permutations. The first 100 are shown.

3. **Custom puzzle detection**: Works on NYT's custom puzzle creator. May not work on third-party Wordle clones.

## Troubleshooting

**Panel doesn't appear**
- Make sure you clicked "Play" on the splash screen
- Refresh the page
- Check console (F12) for errors

**Wrong word length detected**
- Refresh the page after puzzle loads
- Check that tiles are visible before guessing

**Permutations seem wrong**
- Check the Constraint Details (expand the section)
- Verify greens/yellows/grays match what you see in the game
- Report specific cases with guess words + evaluations

## Testing

See `TESTING_GUIDE.md` for comprehensive test scenarios.

## Version History

**1.0.0** - Initial Release
- Variable word length support (4-7 letters)
- Permutation generation with correct repeated letter handling
- User notes area
- Collapsible constraint details
- Green/Yellow/Gray layered approach

## License

Personal use extension - modify as you wish!

## Credits

Built for efficient Wordle puzzle solving with a focus on clarity and correctness.
