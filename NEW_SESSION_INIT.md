# New Session Initialization

Copy and paste the block below to start a new session:

---

I'm working on a Chrome extension called "Wordle Buddy" located at `/Users/corey/Documents/Categories/Projects/extensions/wordle-buddy/`.

The extension is **fully functional** (v1.2.0). It generates permutations for Wordle puzzles of any length (4–7 letters) using a layered Green/Yellow/Gray constraint approach. The core algorithm correctly handles repeated letters using a "maxKnown" pattern where we track the maximum known occurrences across all guesses, then subtract greens to get yellows.

Please read the following files for context:
1. `QUICK_REFERENCE.md` — Quick overview and current feature status
2. `SESSION_HANDOFF.md` — Complete technical details

Key facts:
- User is Hugh (prefers iterative development, values accuracy over speed, no sycophancy)
- Core algorithm is in `permutationEngine.js` (especially `processGuess()`)
- The maxKnown pattern is critical: `yellows[letter].count = maxKnown - greensCount`
- `invalidPositions` must include both `present` AND `absent` evaluation positions
- Settings page UI exists (`options.html`) but `options.js` is a stub — not yet functional
- Ignore the `archive/` subdirectory

**My request**: [State your specific request here]

---

**Important**: This is a handoff to continue working on an existing, functional project. Do not suggest rebuilding from scratch or changing the core algorithm unless there's a confirmed bug and a test case that demonstrates it.
