# Wordle Buddy - Quick Reference

## 📍 Project Location
`/Users/corey/Documents/Categories/Projects/extensions/wordle-buddy/`

## 🎯 Current Status
✅ **FULLY FUNCTIONAL** - All features working perfectly

## 🚀 Quick Start for New Session

Use this exact initialization:

```
I'm working on the Wordle Buddy Chrome extension at:
/Users/corey/Documents/Categories/Projects/extensions/wordle-buddy/

The extension is fully functional. Please read SESSION_HANDOFF.md for complete context.

I need help with: [state your request]
```

## 🔑 Key Files

**Core Logic** (read these first):
- `permutationEngine.js` - THE BRAIN (especially `processGuess()` method)
- `gameAdapter.js` - Reads Wordle DOM
- `content.js` - UI coordinator

**Documentation**:
- `SESSION_HANDOFF.md` - Complete technical context
- `README.md` - User documentation

## 🧠 Core Algorithm (30-second version)

**The maxKnown Pattern**:
```javascript
// Track MAX occurrences across ALL guesses
yellows[letter].maxKnown = Math.max(yellows[letter].maxKnown, knownCount);

// Calculate yellows needed
yellows[letter].count = maxKnown - greensCount;
```

**Why it works**:
- EERIE → maxKnown=2, greens=1, yellows=1 ✓
- SCENE → maxKnown=2, greens=2, yellows=0 ✓

Without maxKnown, yellows would stay at 1 forever.

## 🛠️ Make Changes

1. Edit files in the project directory
2. `brave://extensions/` → click refresh (⟳)
3. Reload Wordle page
4. Test

## 🧪 Test It

Answer: THEME
- Guess: EERIE → Should show 3 permutations
- Guess: SCENE → Should show 1 permutation: `__e_e`

## 👤 User Context

- Name: Hugh (Corey)
- Style: Iterative, test-driven, values accuracy
- Prefers: Direct feedback, concrete examples
- Appreciates: Honesty, no sycophancy

## ⚠️ Critical: Don't Break This

The `processGuess()` method in `permutationEngine.js` is the core algorithm. Any changes to how it tracks maxKnown or calculates yellows.count must maintain the pattern:

```
maxKnown = max across all guesses
yellows.count = maxKnown - greensCount
```

## 📊 What's Working

✅ Variable word length (4-7)
✅ Repeated letter handling
✅ Permutation generation
✅ User notes (persist)
✅ Excluded letters (sorted)
✅ UI (clean, minimal)

## 🎨 What's Intentionally NOT Included

❌ Default starting words
❌ Second word suggestions
❌ Auto-solve
❌ Word dictionary

(These assume 5-letter words or reduce user agency)

## 📝 Last Session Summary

Built a complete Chrome extension from scratch using Hugh's layered constraint approach (Green/Yellow/Gray). Fixed critical bug in yellow count calculation using maxKnown pattern. All cosmetic tweaks completed. Extension is production-ready.

---

**Read SESSION_HANDOFF.md for full technical details.**
