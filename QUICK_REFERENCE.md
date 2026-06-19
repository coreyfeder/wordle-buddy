# Wordle Buddy - Quick Reference

## 📍 Project Location
`/Users/corey/Documents/Categories/Projects/extensions/wordle-buddy/`

> Ignore the `archive/` subdirectory — old session files, not part of active project.

## 🎯 Current Status
✅ **FULLY FUNCTIONAL** — v1.4.0

## 🚀 Quick Start for New Session

Use `NEW_SESSION_INIT.md` for the exact copy-paste initialization prompt.

## 🔑 Key Files

**Core Logic**:
- `permutationEngine.js` — THE BRAIN (especially `processGuess()`)
- `gameAdapter.js` — Reads Wordle DOM
- `content.js` — UI coordinator, drag logic, settings scaffolding

**Settings**:
- `options.html` — Settings page UI
- `options.js` — Settings page logic (loads/saves via `chrome.storage.local`)

**Documentation**:
- `SESSION_HANDOFF.md` — Complete technical context
- `CHANGELOG.md` — Version history

## 🧠 Core Algorithm (30-second version)

**The maxKnown Pattern**:
```javascript
// Track MAX occurrences across ALL guesses
yellows[letter].maxKnown = Math.max(yellows[letter].maxKnown, knownCount);

// Calculate yellows still needed
yellows[letter].count = maxKnown - greensCount;
```

**Why it works**:
- EERIE → maxKnown=2, greens=1, yellows=1 ✓
- SCENE → maxKnown=2, greens=2, yellows=0 ✓

**Also critical**: `invalidPositions` includes positions from BOTH `present` AND `absent` evaluations. Without this, gray positions appear in permutations.

## 🛠️ Reload After Changes

1. Edit files in the project directory
2. `brave://extensions/` → click refresh (⟳)
3. Reload Wordle page
4. Test

## 🧪 Test Cases

**Answer: THEME**
- Guess EERIE → 3 permutations
- Guess SCENE → 1 permutation (`__e_e`) → victory message fires

**Answer: NEWLY** (tests gray position exclusion)
- Guess ADIEU, STORY, ELEGY
- E at position 3 in ELEGY is gray → must not appear at that position in any permutation

## 👤 User Context

- **Name**: Hugh (Corey)
- **Style**: Iterative, test-driven, values accuracy
- **Prefers**: Direct feedback, concrete examples, no sycophancy

## ⚠️ Critical: Don't Break This

The `processGuess()` method in `permutationEngine.js` is the core algorithm. Do not change the maxKnown pattern or the invalidPositions logic without a confirmed bug and a test case.

## 📊 What's Working

✅ Variable word length (4–7)
✅ Repeated letter handling (maxKnown)
✅ Gray position exclusion (invalidPositions fix)
✅ Permutation generation
✅ Game-status banners (won / lost / one-answer-left; answer hidden when solved)
✅ User notes (persist across guesses and reloads)
✅ Excluded letters display (sorted)
✅ Draggable panel (position saved, clamped to viewport)
✅ Resizable panel (size saved, clamped to viewport; visible resize handle)
✅ Settings page (loads/saves via chrome.storage.local; live panel updates)
✅ Panel deferred until game is ready (no splash-screen flash)

## 🎨 Intentionally NOT Included

❌ Default starting words
❌ Second word suggestions
❌ Auto-solve / word dictionary
❌ Letter frequency analysis

---

## 📝 Commit & Documentation Conventions

**Format:** semantic commits — `type(scope): subject`
- Common types: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`
- `feat` = new capability; `fix` = something broken or not matching design intent

**Length:** as short as the change allows
- If the subject line covers it, stop there
- A 1–2 sentence body is the ceiling; extended context belongs in a PR description, not a commit

**Commit message vs. code comment:**
- Commit message = *what* changed and *why it needed to change*
- Code comment = *why it's written this way* (the non-obvious reasoning a reader would question)
- Detail belongs in the code, where it's read in context; commit messages are scanned, not studied

---

**Read `SESSION_HANDOFF.md` for full technical details.**
