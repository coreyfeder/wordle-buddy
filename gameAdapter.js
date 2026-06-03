/**
 * GameAdapter - Interface for reading Wordle game state
 */

class WordleGameAdapter {
  constructor() {
    this.name = 'Wordle';
    this.rowSelectors = [
      'div[class*="Row-module_row"]',
      'div[class*="row"]',
      '.Row-locked-in',
      '[data-testid="row"]'
    ];
    this.tileSelectors = [
      'div[class*="Tile-module_tile"]',
      'div[class*="tile"]',
      '.Tile-locked-in',
      '[data-testid="tile"]'
    ];
  }

  /**
   * Detect word length from game board
   * @returns {number} - Word length (4-7)
   */
  detectWordLength() {
    const rows = this._getRows();
    if (rows.length === 0) return 5; // Default

    const firstRow = rows[0];
    const tiles = this._getTiles(firstRow);
    const length = tiles.length;

    console.log(`Detected word length: ${length}`);
    return length;
  }

  /**
   * Read the current state of the game board
   * @returns {Object} - {wordLength, completedGuesses}
   */
  readGameState() {
    const wordLength = this.detectWordLength();
    const rows = this._getRows();
    const completedGuesses = [];

    rows.forEach((row, rowIndex) => {
      const tiles = this._getTiles(row);
      const letters = [];
      const evaluations = [];

      tiles.forEach(tile => {
        const letter = tile.textContent.trim().toUpperCase();
        const evaluation = this._getTileEvaluation(tile);
        
        if (letter) {
          letters.push(letter);
          evaluations.push(evaluation);
        }
      });

      // Only include completed rows (all tiles evaluated)
      if (letters.length === wordLength && 
          evaluations.every(e => e !== 'tbd' && e !== 'empty')) {
        completedGuesses.push({
          rowIndex,
          word: letters.join(''),
          evaluations
        });
      }
    });

    return {
      wordLength,
      totalRows: rows.length,
      completedGuesses
    };
  }

  _getRows() {
    for (const selector of this.rowSelectors) {
      const rows = document.querySelectorAll(selector);
      if (rows.length > 0) {
        return rows;
      }
    }
    return [];
  }

  _getTiles(row) {
    for (const selector of this.tileSelectors) {
      const tiles = row.querySelectorAll(selector);
      if (tiles.length > 0) {
        return tiles;
      }
    }
    return [];
  }

  _getTileEvaluation(tile) {
    // Check data-state attribute first
    const dataState = tile.getAttribute('data-state');
    if (dataState) {
      return dataState; // 'correct', 'present', 'absent', 'tbd', 'empty'
    }

    // Fallback to class-based detection
    const classes = tile.className;
    if (classes.includes('correct')) return 'correct';
    if (classes.includes('present')) return 'present';
    if (classes.includes('absent')) return 'absent';
    return 'tbd';
  }

  isGameReady() {
    const rows = this._getRows();
    if (rows.length === 0) {
      return false;
    }

    // Check if any row has tiles
    for (const row of rows) {
      const tiles = this._getTiles(row);
      if (tiles.length >= 4) { // Minimum word length
        return true;
      }
    }

    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = WordleGameAdapter;
}
