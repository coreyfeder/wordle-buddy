# Wordle Buddy v0.2.0 - Change Log

## Release Date: May 17, 2026

## Overview
Major feature release with bug fixes, UI improvements, drag-and-drop functionality, and comprehensive settings system.

---

## 🐛 Bug Fixes

### 1. **CRITICAL: Fixed Permutation Generation Bug**
**Issue**: Permutations incorrectly included letters in positions marked as gray (absent).

**Example**:
- Answer: NEWLY
- Guess: ELEGY
- E at position 3 is gray (absent), but permutations still showed patterns with E at position 3

**Root Cause**: The `processGuess()` method only added `present` positions to `invalidPositions`, not `absent` positions.

**Fix**: Added code to also track absent positions as invalid when the letter exists elsewhere:
```javascript
// Now adds invalid positions from both present AND absent evaluations
occurrences.absent.forEach(pos => {
  this.yellows[letter].invalidPositions.add(pos);
});
```

**Files Changed**: `permutationEngine.js`

---

## ✨ New Features

### 2. **Victory Message**
When only one permutation remains, displays an encouraging message instead of revealing the answer:

> ✨ You know all you need to know! ✨  
> Put the pieces together for that victorious feeling!

This preserves the user's sense of accomplishment in solving the puzzle themselves.

**Files Changed**: `content.js`

### 3. **Draggable Panel**
- Panel can now be dragged by clicking and dragging the header
- Position is saved and restored between sessions
- Uses smooth mouse tracking for natural movement
- Cursor changes to `grabbing` during drag
- Won't interfere with the minimize button

**Files Changed**: `content.js`, `content.css`

### 4. **Resizable Panel**
- Panel now supports CSS `resize: both`
- Users can drag the bottom-right corner to resize
- Min width: 150px, Max width: 600px
- Height dynamically adjusts to fill viewport

**Files Changed**: `content.css`

### 5. **Comprehensive Settings System**
Full-featured settings panel with the following options:

#### Display Settings:
- **Zoom**: 80% to 150% (10% increments)
- **Color Scheme**: Auto (match game) / Light Mode / Dark Mode
- **Show Constraint Details**: Toggle visibility of constraint details section
- **Show Section Headers**: Toggle "Possible Permutations", "Your Notes", etc.

#### Permutations Customization:
- **Font**: Courier New (Monospace) / Clear Sans (Sans-Serif) / System Default
- **Size**: Small (13px) / Medium (15px) / Large (18px)

#### Notes Customization:
- **Font**: Clear Sans / Courier New / System Default
- **Size**: Small (12px) / Medium (13px) / Large (15px)

**Settings Access**: Click the ⚙️ icon in the panel header

**Settings Persistence**: All settings saved to `chrome.storage.local` and restored on page load

**Files Changed**: `panel.html`, `content.css`, `content.js`

---

## 🎨 UI/UX Improvements

### 6. **Compact Permutation Display**
- Reduced padding: `10px 14px` → `4px 8px`
- Smaller borders: `1px solid #6aaa64` → `1px solid #d0d0d0` (lighter)
- Reduced gap between items: `4px` → `2px`
- Slightly smaller font: `18px` → `15px`
- Added center alignment for better appearance
- **Goal**: Fit more permutations on screen at once

**Files Changed**: `content.css`

### 7. **Optimized Panel Dimensions**
- **Default width**: `380px` → `180px` (about half)
- **Position**: Moved closer to top (`80px` → `60px`) and right edge (`20px` → `10px`)
- **Height**: Now fills almost entire viewport height: `calc(100vh - 70px)`
- **Flexbox layout**: Panel uses modern flexbox for better content distribution

**Files Changed**: `content.css`

### 8. **Dynamic Notes Area**
- Notes textarea now expands to fill remaining vertical space
- Uses `flex: 1` to automatically size based on permutations
- Removed fixed `rows="4"` attribute
- Set `resize: none` (panel itself is resizable)
- Minimum height: `60px`

**Files Changed**: `panel.html`, `content.css`

### 9. **Visual Polish**
- Reduced section margins: `20px` → `12px`
- Reduced panel padding: `16px` → `12px`
- Added `flex-shrink: 0` to prevent sections from collapsing unexpectedly
- Header now has `cursor: move` and `user-select: none`
- Settings button with gear icon (⚙️) added to header

**Files Changed**: `content.css`, `panel.html`

---

## 🔧 Technical Improvements

### Code Organization
- Added `setupSettings()` function (200+ lines)
- Added `loadSettings()`, `applySetting()`, `applySettingToUI()` functions
- Added `setupDragging()` function with drag start/move/end logic
- Added `savePosition()` and `restorePosition()` functions
- All settings logic cleanly separated from core functionality

### Storage Keys
- `userNotes`: User's text notes
- `panelPosition`: `{x, y}` coordinates
- `settings`: Object with all user preferences

### Default Settings
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

---

## 📁 Files Modified

| File | Changes |
|------|---------|
| `manifest.json` | Version bump: 1.0.0 → 0.2.0 |
| `permutationEngine.js` | Bug fix: added absent positions to invalidPositions |
| `content.js` | Victory message, dragging logic, settings system (+250 lines) |
| `content.css` | Compact UI, flexbox layout, settings overlay styles (+150 lines) |
| `panel.html` | Settings button, settings overlay UI, notes-section class (+80 lines) |

---

## 🧪 Testing Checklist

- [ ] Bug #1: Gray positions no longer appear in permutations
  - Test with NEWLY → ADIEU, STORY, ELEGY
  - Verify E does not appear at position 3 in any permutation
- [ ] Victory message appears when 1 permutation remains
- [ ] Panel can be dragged by header
- [ ] Panel position persists after page reload
- [ ] Panel can be resized from bottom-right corner
- [ ] Settings button opens settings overlay
- [ ] All settings save and restore correctly
- [ ] Zoom works (80%-150%)
- [ ] Color schemes work (Light/Dark/Auto)
- [ ] Toggle details and headers work
- [ ] Font and size changes apply to permutations
- [ ] Font and size changes apply to notes
- [ ] Notes area expands to fill remaining space
- [ ] Permutations display is more compact
- [ ] All features work on 4-7 letter puzzles

---

## 📊 Lines of Code Added

- **content.js**: ~250 lines
- **content.css**: ~150 lines  
- **panel.html**: ~80 lines
- **Total**: ~480 new lines of production code

---

## 🚀 Upgrade Instructions

1. Navigate to `brave://extensions/`
2. Find "Wordle Buddy"
3. Click refresh icon (⟳)
4. Reload any open Wordle pages
5. Settings will be at default - customize via ⚙️ button

---

## 🔮 Future Enhancements (Not in this version)

- Keyboard shortcuts for panel operations
- Export/import settings
- Custom color themes
- Remember panel size (currently only position is saved)
- Settings profiles for different puzzle types

---

## 🙏 Credits

**Developer**: Hugh (Corey)  
**Development Approach**: Iterative, test-driven  
**Testing**: Manual testing on NYT Wordle (daily and custom puzzles)  
**Browser**: Brave (Chromium-based)  

---

**Previous Version**: 1.0.0  
**Current Version**: 0.2.0  
**Next Planned Version**: 0.3.0 (TBD)
