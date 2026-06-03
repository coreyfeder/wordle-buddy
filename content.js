/**
 * Content Script - Main entry point for Wordle Buddy
 */

console.log('Wordle Buddy content script loaded');

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  setTimeout(init, 1000);
}

let gameAdapter;
let permutationEngine;
let panelElement;
let currentGameState = null;
let isMonitoring = false;
let isPanelCollapsed = false;

async function init() {
  console.log('Wordle Buddy initializing...');

  try {
    gameAdapter = new WordleGameAdapter();
    permutationEngine = new PermutationEngine();

    // Panel is not injected until the game is actually ready —
    // nothing appears on the splash screen.
    waitForGameReady()
      .then(async () => {
        await injectPanel();
        activateBuddy();
      })
      .catch(error => {
        console.error('Wordle Buddy: game never loaded', error);
      });

    console.log('Wordle Buddy initialized');
  } catch (error) {
    console.error('Wordle Buddy initialization error:', error);
  }
}

function waitForGameReady() {
  return new Promise((resolve, reject) => {
    // Already ready (e.g. extension reloaded mid-game)
    if (gameAdapter.isGameReady()) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error('Timed out waiting for game'));
    }, 60000);

    const observer = new MutationObserver(() => {
      if (gameAdapter.isGameReady()) {
        clearTimeout(timeoutId);
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state']
    });
  });
}

function activateBuddy() {
  startMonitoring();
  console.log('Wordle Buddy fully activated!');
}

async function injectPanel() {
  try {
    const response = await fetch(chrome.runtime.getURL('panel.html'));
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    panelElement = doc.getElementById('wordle-buddy-panel');

    if (!panelElement) {
      throw new Error('Could not find panel element in HTML');
    }

    document.body.appendChild(panelElement);
    console.log('Panel element added to DOM');

    setupEventListeners();
    restoreNotes();
    restorePosition();
    restoreSize();
    setupSizeObserver();
    setupStorageListener();
    applyStoredSettings();
    requestAnimationFrame(updateMaxHeight); // set initial maxHeight from CSS default position

    console.log('Panel fully initialized');
  } catch (error) {
    console.error('Error injecting panel:', error);
    throw error;
  }
}

function setupEventListeners() {
  // Prevent keypresses in panel from propagating to game
  panelElement.addEventListener('keydown', (e) => e.stopPropagation());
  panelElement.addEventListener('keyup', (e) => e.stopPropagation());
  panelElement.addEventListener('keypress', (e) => e.stopPropagation());

  // Make panel draggable by header
  setupDragging();

  // Toggle panel
  const toggleBtn = document.getElementById('toggle-panel');
  const panelContent = panelElement.querySelector('.panel-content');
  toggleBtn.addEventListener('click', () => {
    const collapsing = !panelContent.classList.contains('collapsed');
    panelContent.classList.toggle('collapsed');
    toggleBtn.textContent = collapsing ? '+' : '−';
    isPanelCollapsed = collapsing;

    if (collapsing) {
      // Snapshot the current inline height (empty string if never manually resized)
      // then shrink to just the header
      panelElement.dataset.expandedHeight = panelElement.style.height;
      panelElement.style.height = 'auto';
      panelElement.style.resize = 'none';
    } else {
      panelElement.style.height = panelElement.dataset.expandedHeight;
      panelElement.style.resize = '';
    }
  });

  // Keep maxHeight in sync when the browser window is resized
  window.addEventListener('resize', updateMaxHeight);

  // Collapsible constraints
  const constraintsHeader = document.getElementById('constraints-header');
  const constraintsContent = document.getElementById('constraints-content');
  constraintsHeader.addEventListener('click', () => {
    constraintsContent.classList.toggle('collapsed');
  });

  // Auto-save notes
  const notesArea = document.getElementById('user-notes');
  notesArea.addEventListener('input', () => {
    saveNotes(notesArea.value);
  });
}

function setupDragging() {
  const header = panelElement.querySelector('.panel-header');
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    // Don't drag if clicking on the toggle button
    if (e.target.id === 'toggle-panel') return;

    const rect = panelElement.getBoundingClientRect();
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    // Store current position
    xOffset = rect.left;
    yOffset = rect.top;
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    isDragging = true;
    header.style.cursor = 'grabbing';
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      // Clamp so the header stays within the viewport — prevents the panel
      // from being dragged to an unreachable position
      currentX = Math.max(0, Math.min(window.innerWidth  - panelElement.offsetWidth,  e.clientX - initialX));
      currentY = Math.max(0, Math.min(window.innerHeight - header.offsetHeight,        e.clientY - initialY));

      xOffset = currentX;
      yOffset = currentY;

      panelElement.style.left = `${currentX}px`;
      panelElement.style.top = `${currentY}px`;
      panelElement.style.right = 'auto';
      panelElement.style.bottom = 'auto';
    }
  }

  function dragEnd(e) {
    if (isDragging) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      header.style.cursor = 'move';

      // Save position
      savePosition(currentX, currentY);
      updateMaxHeight(); // bottom edge can't exceed viewport from new position
    }
  }
}

function savePosition(x, y) {
  chrome.storage.local.set({ panelPosition: { x, y } });
}

function restorePosition() {
  chrome.storage.local.get(['panelPosition'], (result) => {
    if (result.panelPosition) {
      const { x, y } = result.panelPosition;
      // Defer until after first paint so offsetWidth/Height are reliable;
      // also clamps any stored out-of-bounds position back into the viewport
      requestAnimationFrame(() => {
        const clampedX = Math.max(0, Math.min(window.innerWidth  - panelElement.offsetWidth,  x));
        const clampedY = Math.max(0, Math.min(window.innerHeight - panelElement.offsetHeight, y));
        panelElement.style.left   = `${clampedX}px`;
        panelElement.style.top    = `${clampedY}px`;
        panelElement.style.right  = 'auto';
        panelElement.style.bottom = 'auto';
        updateMaxHeight();
      });
    }
  });
}

function setupStorageListener() {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.settings) return;
    const newSettings = changes.settings.newValue || {};
    const oldSettings = changes.settings.oldValue || {};
    Object.keys(newSettings).forEach(key => {
      if (newSettings[key] !== oldSettings[key]) {
        applySettingToUI(key, newSettings[key]);
      }
    });
  });
}

function updateMaxHeight() {
  // Constrain resize so the bottom edge can't extend past the viewport
  const top = panelElement.getBoundingClientRect().top;
  panelElement.style.maxHeight = `${window.innerHeight - top}px`;
}

function saveSize(width, height) {
  chrome.storage.local.set({ panelSize: { width, height } });
}

function restoreSize() {
  chrome.storage.local.get(['panelSize'], (result) => {
    if (result.panelSize) {
      const { width, height } = result.panelSize;
      panelElement.style.width  = `${width}px`;
      panelElement.style.height = `${height}px`;
    }
  });
}

function setupSizeObserver() {
  let debounceTimer;
  const observer = new ResizeObserver(entries => {
    if (isPanelCollapsed) return; // don't overwrite saved expanded height with collapsed height
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const entry = entries[entries.length - 1];
      const { width, height } = entry.contentRect;
      saveSize(Math.round(width), Math.round(height));
    }, 300);
  });
  observer.observe(panelElement);
}

function saveNotes(notes) {
  chrome.storage.local.set({ userNotes: notes });
}

function restoreNotes() {
  chrome.storage.local.get(['userNotes'], (result) => {
    if (result.userNotes) {
      document.getElementById('user-notes').value = result.userNotes;
    }
  });
}

function startMonitoring() {
  isMonitoring = true;

  const observer = new MutationObserver(() => {
    checkGameStateChange();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-state', 'class']
  });
}

function checkGameStateChange() {
  const newGameState = gameAdapter.readGameState();

  if (JSON.stringify(newGameState) !== JSON.stringify(currentGameState)) {
    currentGameState = newGameState;
    handleGameStateUpdate();
  }
}

function handleGameStateUpdate() {
  if (!currentGameState) return;

  const { wordLength, completedGuesses } = currentGameState;

  // Reset permutation engine with correct word length
  permutationEngine.setWordLength(wordLength);

  // Process all completed guesses
  completedGuesses.forEach(guess => {
    permutationEngine.processGuess(guess.word, guess.evaluations);
  });

  // Determine game status from guess outcomes
  const lastGuess  = completedGuesses[completedGuesses.length - 1];
  const isWon  = lastGuess && lastGuess.evaluations.every(e => e === 'correct');
  const isLost = !isWon && completedGuesses.length > 0 &&
                 completedGuesses.length >= currentGameState.totalRows;
  const gameStatus = isWon ? 'won' : isLost ? 'lost' : 'playing';

  // Generate and display permutations
  const permutations = permutationEngine.generatePermutations();
  updatePermutationsDisplay(permutations, gameStatus);

  // Update constraints display
  updateConstraintsDisplay();
}

function updatePermutationsDisplay(permutations, gameStatus) {
  const display = document.getElementById('permutations-display');
  const banner  = document.getElementById('game-status-banner');
  const permBox = document.getElementById('permutations-box');

  // Reset
  banner.className      = 'game-status-banner hidden';
  permBox.style.display = '';

  if (gameStatus === 'won') {
    banner.textContent    = 'Great job!';
    banner.className      = 'game-status-banner won';
    permBox.style.display = 'none';
    return;
  }

  if (gameStatus === 'lost') {
    banner.textContent = 'Better luck next time.';
    banner.className   = 'game-status-banner lost';
    // permutations box stays visible — fall through to normal display
  }

  if (permutations.length === 0) {
    display.innerHTML = '<p class="placeholder">Play a word to see permutations</p>';
    return;
  }

  // Single fully-determined permutation while still playing
  if (gameStatus === 'playing' && permutations.length === 1 && !permutations[0].includes('_')) {
    banner.textContent    = 'Only one possible answer now!';
    banner.className      = 'game-status-banner constrained';
    permBox.style.display = 'none';
    return;
  }

  // Normal permutation list
  const summary = permutationEngine.getSummary();
  const maxDisplay = 100;
  const displayPermutations = permutations.slice(0, maxDisplay);
  const hasMore = permutations.length > maxDisplay;

  let html = '<div class="permutation-list">';
  displayPermutations.forEach(perm => {
    html += `<div class="permutation-item">${perm}</div>`;
  });
  html += '</div>';

  if (hasMore) {
    html += `<p class="permutation-count">Showing first ${maxDisplay} of ${permutations.length} permutations</p>`;
  } else if (permutations.length > 1) {
    html += `<p class="permutation-count">${permutations.length} possible permutations</p>`;
  }

  if (summary.grays.length > 0) {
    html += `<p class="permutation-count" style="margin-top: 4px; color: #333;">Excluded: ${summary.grays.sort().join(' ')}</p>`;
  }

  display.innerHTML = html;
}

function updateConstraintsDisplay() {
  const summary = permutationEngine.getSummary();
  const display = document.getElementById('constraints-display');

  if (summary.greens.length === 0 &&
      summary.yellows.length === 0 &&
      summary.grays.length === 0) {
    display.innerHTML = '<p class="placeholder">No constraints yet</p>';
    return;
  }

  let html = '<div>';

  if (summary.greens.length > 0) {
    html += '<div class="constraint-item">';
    html += '<span class="constraint-label">Greens:</span>';
    summary.greens.forEach(({ position, letter }) => {
      html += `<span class="green-letter">${letter}</span> at ${position} `;
    });
    html += '</div>';
  }

  if (summary.yellows.length > 0) {
    html += '<div class="constraint-item">';
    html += '<span class="constraint-label">Yellows:</span>';
    summary.yellows.forEach(({ letter, count, invalidPositions }) => {
      const countText = count > 1 ? ` (×${count})` : '';
      const posText = invalidPositions.length > 0 ?
        ` not at ${invalidPositions.join(', ')}` : '';
      html += `<span class="yellow-letter">${letter}${countText}</span>${posText} `;
    });
    html += '</div>';
  }

  if (summary.grays.length > 0) {
    html += '<div class="constraint-item">';
    html += '<span class="constraint-label">Grays:</span>';
    summary.grays.forEach(letter => {
      html += `<span class="gray-letter">${letter}</span> `;
    });
    html += '</div>';
  }

  html += '</div>';
  display.innerHTML = html;
}

// Settings Management
const defaultSettings = {
  colorScheme: 'auto',
  showDetails: false,
  showHeaders: true,
  permFont: 'monospace',
  permSize: 16,         // pixels; keep in sync with options.js defaultSettings
  permBold: false,
  notesFont: 'monospace', // keep in sync with options.js defaultSettings
  notesSize: 14,         // pixels; keep in sync with options.js defaultSettings
  notesBold: true
};

function applyStoredSettings() {
  // Apply settings from storage without touching the settings UI
  chrome.storage.local.get(['settings'], (result) => {
    const settings = { ...defaultSettings, ...(result.settings || {}) };

    // Apply all settings to the panel only
    Object.keys(settings).forEach(key => {
      applySettingToUI(key, settings[key]);
    });
  });
}

function applySettingToUI(key, value) {
  const panel = panelElement;

  switch (key) {
    case 'colorScheme': {
      // Reset all inline colour overrides first so switching between modes is clean
      panel.style.backgroundColor = '';
      panel.style.color = '';
      panel.querySelectorAll('.section h4').forEach(el => { el.style.color = ''; });
      panel.querySelectorAll('.info-box').forEach(el => {
        el.style.backgroundColor = '';
        el.style.borderColor = '';
      });
      panel.querySelectorAll('.permutation-item').forEach(el => {
        el.style.backgroundColor = '';
        el.style.color = '';
        el.style.borderColor = '';
      });
      const csNotes = panel.querySelector('.notes-area');
      if (csNotes) {
        csNotes.style.backgroundColor = '';
        csNotes.style.color = '';
        csNotes.style.borderColor = '';
      }

      if (value === 'dark') {
        panel.style.backgroundColor = '#1a1a1a';
        panel.style.color = '#e0e0e0';
        panel.querySelectorAll('.section h4').forEach(el => { el.style.color = '#e0e0e0'; });
        panel.querySelectorAll('.info-box').forEach(el => {
          el.style.backgroundColor = '#2a2a2a';
          el.style.borderColor = '#444';
        });
        panel.querySelectorAll('.permutation-item').forEach(el => {
          el.style.backgroundColor = '#2a2a2a';
          el.style.color = '#e0e0e0';
          el.style.borderColor = '#444';
        });
        if (csNotes) {
          csNotes.style.backgroundColor = '#2a2a2a';
          csNotes.style.color = '#e0e0e0';
          csNotes.style.borderColor = '#444';
        }
      } else if (value === 'light') {
        panel.style.backgroundColor = 'white';
        panel.style.color = '#333';
        // h4, info-box, permutation-item all reset to CSS defaults above
      }
      // 'auto': reset only — already done
      break;
    }

    case 'showDetails':
      const detailsSection = panel.querySelector('.section:has(#constraints-header)');
      if (detailsSection) {
        detailsSection.style.display = value ? 'block' : 'none';
      }
      break;

    case 'showHeaders':
      panel.querySelectorAll('.section h4').forEach(header => {
        header.style.display = value ? 'block' : 'none';
      });
      break;

    case 'permFont':
      const fontMap = {
        'monospace': "'Courier New', monospace",
        'sans-serif': "'Clear Sans', Arial, sans-serif",
        'serif': 'Georgia, serif'
      };
      panel.querySelectorAll('.permutation-item').forEach(el => {
        el.style.fontFamily = fontMap[value];
      });
      break;

    case 'permSize':
      panel.querySelectorAll('.permutation-item').forEach(el => {
        el.style.fontSize = `${value}px`;
      });
      break;

    case 'permBold':
      panel.querySelectorAll('.permutation-item').forEach(el => {
        el.style.fontWeight = value ? '700' : '';
      });
      break;

    case 'notesBold': {
      const notesBoldEl = panel.querySelector('.notes-area');
      if (notesBoldEl) notesBoldEl.style.fontWeight = value ? '700' : '';
      break;
    }

    case 'notesFont':
      const notesFontMap = {
        'sans-serif': "'Clear Sans', Arial, sans-serif",
        'monospace': "'Courier New', monospace",
        'serif': 'Georgia, serif'
      };
      const notesArea = panel.querySelector('.notes-area');
      if (notesArea) {
        notesArea.style.fontFamily = notesFontMap[value];
      }
      break;

    case 'notesSize':
      const notesTextarea = panel.querySelector('.notes-area');
      if (notesTextarea) {
        notesTextarea.style.fontSize = `${value}px`;
      }
      break;
  }
}
