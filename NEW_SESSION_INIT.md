# New Session Initialization

Copy and paste this exactly to start a new session:

---

I'm working on a Chrome extension called "Wordle Buddy" located at `/Users/corey/Documents/Categories/Projects/extensions/wordle-buddy/`. 

The extension is **fully functional and deployed**. It generates permutations for Wordle puzzles of any length (4-7 letters) using a layered Green/Yellow/Gray constraint approach. The core algorithm correctly handles repeated letters using a "maxKnown" pattern where we track the maximum known occurrences across all guesses, then subtract greens to get yellows.

Please read the following files for context:
1. `/Users/corey/Documents/Categories/Projects/extensions/wordle-buddy/QUICK_REFERENCE.md` - Quick overview
2. `/Users/corey/Documents/Categories/Projects/extensions/wordle-buddy/SESSION_HANDOFF.md` - Complete technical details

The extension is working perfectly. All core features are tested and functional:
- Variable word length detection (4-7 letters)
- Accurate permutation generation
- Correct repeated letter handling (e.g., THEME/EERIE/SCENE test case)
- User notes persistence
- Excluded letters display
- Clean, minimal UI

Key technical context:
- User is Hugh (prefers iterative development, values accuracy over speed)
- Core algorithm is in `permutationEngine.js` (especially the `processGuess()` method)
- The maxKnown pattern is critical: `yellows[letter].count = maxKnown - greensCount`
- Code is well-documented with inline comments

**My request**: [State your specific request here]

---

**Important**: This is a handoff to continue working on an existing, functional project. Do not suggest rebuilding from scratch or changing the core algorithm unless there's a confirmed bug.
