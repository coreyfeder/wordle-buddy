/**
 * PermutationEngine - Generates valid word permutations using layered constraint approach
 * 
 * Terminology:
 * - Green: Letter confirmed in correct position
 * - Yellow: Letter confirmed present but position unknown
 * - Gray: Letter confirmed absent from word
 */

class PermutationEngine {
  constructor() {
    this.wordLength = 5; // Default, will be updated from game board
    this.reset();
  }

  reset() {
    // Layer 1: Greens - positions with confirmed letters
    this.greens = {}; // position -> letter

    // Layer 2: Yellows - letters that must be placed
    this.yellows = {}; // letter -> {count: N, invalidPositions: Set}

    // Grays - letters confirmed absent
    this.grays = new Set();
  }

  setWordLength(length) {
    this.wordLength = length;
    this.reset();
  }

  /**
   * Process a guess result
   * 
   * CRITICAL ALGORITHM: maxKnown Pattern
   * 
   * Problem: When yellows become greens in later guesses, we need to update counts correctly.
   * Solution: Track MAX known occurrences across ALL guesses, then subtract greens at the end.
   * 
   * Example (Answer: THEME with 2 E's):
   *   After EERIE [Y,-,-,-,G]: knownCount=2, greens=1, maxKnown=2, yellows.count=2-1=1 ✓
   *   After SCENE [-,-,G,-,G]: knownCount=2, greens=2, maxKnown=2, yellows.count=2-2=0 ✓
   * 
   * Without maxKnown, the second guess would incorrectly keep yellows.count=1 using Math.max.
   * 
   * @param {string} word - The guessed word
   * @param {Array<string>} evaluations - Array of 'correct', 'present', 'absent'
   */
  processGuess(word, evaluations) {
    // First pass: count occurrences by evaluation type
    const letterOccurrences = {};
    
    for (let i = 0; i < word.length; i++) {
      const letter = word[i].toUpperCase();
      if (!letterOccurrences[letter]) {
        letterOccurrences[letter] = { correct: [], present: [], absent: [] };
      }
      
      const evalType = evaluations[i];
      if (evalType === 'correct') {
        letterOccurrences[letter].correct.push(i);
      } else if (evalType === 'present') {
        letterOccurrences[letter].present.push(i);
      } else {
        letterOccurrences[letter].absent.push(i);
      }
    }

    // Second pass: update constraints based on Wordle rules
    for (const [letter, occurrences] of Object.entries(letterOccurrences)) {
      const correctCount = occurrences.correct.length;
      const presentCount = occurrences.present.length;
      const absentCount = occurrences.absent.length;
      
      // Total known occurrences in the answer
      const knownCount = correctCount + presentCount;

      // Update greens (Layer 1)
      occurrences.correct.forEach(pos => {
        this.greens[pos] = letter;
      });

      // Update yellows (Layer 2)
      if (knownCount > 0) {
        if (!this.yellows[letter]) {
          this.yellows[letter] = { count: 0, invalidPositions: new Set(), maxKnown: 0 };
        }

        // CRITICAL: Track the maximum known occurrences across ALL guesses
        // This is the key to handling yellows that become greens
        this.yellows[letter].maxKnown = Math.max(this.yellows[letter].maxKnown, knownCount);
        
        // If we have gray occurrences, it means we know the EXACT total count
        // Example: Guess "EERIE" for answer "THEME" → 2 yellows/greens, 1 gray → exactly 2 E's
        if (absentCount > 0) {
          this.yellows[letter].maxKnown = knownCount;
        }

        // Add invalid positions from present evaluations
        occurrences.present.forEach(pos => {
          this.yellows[letter].invalidPositions.add(pos);
        });

        // CRITICAL FIX: Also add invalid positions from absent evaluations
        // If a letter is absent at a position but exists elsewhere (greens/yellows),
        // that position is invalid for that letter
        // Example: NEWLY with guess ELEGY → E at position 3 is gray (absent),
        // but E exists at positions 1 and 5, so position 3 is invalid for E
        occurrences.absent.forEach(pos => {
          this.yellows[letter].invalidPositions.add(pos);
        });
        
        // Calculate yellows needed: maxKnown - greens
        // This recalculates every time, so when yellows become greens, count drops to 0
        const greensCount = Object.values(this.greens).filter(l => l === letter).length;
        this.yellows[letter].count = this.yellows[letter].maxKnown - greensCount;
      }

      // Update grays - only if the letter has NO green/yellow occurrences
      if (knownCount === 0) {
        this.grays.add(letter);
      }
    }
  }

  /**
   * Generate all valid permutations
   * @returns {Array<string>} - Array of permutation patterns
   */
  generatePermutations() {
    // Start with greens as the base pattern
    const basePattern = Array(this.wordLength).fill('_');
    for (const [pos, letter] of Object.entries(this.greens)) {
      basePattern[parseInt(pos)] = letter;
    }

    // Collect yellows that need to be placed
    const yellowsToPlace = [];
    for (const [letter, data] of Object.entries(this.yellows)) {
      for (let i = 0; i < data.count; i++) {
        yellowsToPlace.push(letter);
      }
    }

    // If no yellows to place, return the base pattern
    if (yellowsToPlace.length === 0) {
      return [basePattern.join('')];
    }

    const permutations = [];
    this._generatePermutationsRecursive(
      yellowsToPlace,
      0,
      basePattern,
      permutations
    );

    // Remove duplicates and sort
    return [...new Set(permutations)].sort();
  }

  _generatePermutationsRecursive(letters, letterIndex, currentPattern, results) {
    // Base case: all letters placed
    if (letterIndex >= letters.length) {
      results.push(currentPattern.join(''));
      return;
    }

    const letter = letters[letterIndex];
    const invalidPositions = this.yellows[letter]?.invalidPositions || new Set();

    // Try placing this letter in each valid position
    for (let pos = 0; pos < this.wordLength; pos++) {
      // Skip if position already filled
      if (currentPattern[pos] !== '_') continue;
      
      // Skip if this position is invalid for this letter
      if (invalidPositions.has(pos)) continue;

      // Place letter and recurse
      const newPattern = [...currentPattern];
      newPattern[pos] = letter;
      this._generatePermutationsRecursive(
        letters,
        letterIndex + 1,
        newPattern,
        results
      );
    }
  }

  /**
   * Get a summary of current constraints
   * @returns {Object}
   */
  getSummary() {
    const greensArray = [];
    for (let i = 0; i < this.wordLength; i++) {
      if (this.greens[i]) {
        greensArray.push({ position: i + 1, letter: this.greens[i] });
      }
    }

    const yellowsArray = Object.entries(this.yellows)
      .filter(([_, data]) => data.count > 0)
      .map(([letter, data]) => ({
        letter,
        count: data.count,
        invalidPositions: Array.from(data.invalidPositions).map(p => p + 1)
      }));

    return {
      wordLength: this.wordLength,
      greens: greensArray,
      yellows: yellowsArray,
      grays: Array.from(this.grays)
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PermutationEngine;
}
