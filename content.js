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

async function init() {
  console.log('Wordle Buddy initializing...');
  
  try {
    gameAdapter = new WordleGameAdapter();
    permutationEngine = new PermutationEngine();

    await injectPanel();
    console.log('Panel injected');

    showWaitingForGame();

    waitForGameReady()
      .then(() => {
        console.log('Game ready, activating buddy...');
        activateBuddy();
      })
      .catch(error => {
        console.error('Game load timeout:', error);
        showGameLoadError();
      });

    console.log('Wordle Buddy initialized');
  } catch (error) {
    console.error('Wordle Buddy initialization error:', error);
  }
}

function waitForGameReady() {
  return new Promise((resolve, reject) => {
    console.log('Waiting for game to be ready...');
    let attempts = 0;
    const maxAttempts = 120;
    
    const checkReady = setInterval(() => {
      attempts++;
      
      if (gameAdapter.isGameReady()) {
        console.log('Game is ready!');
        clearInterval(checkReady);
        resolve();
      } else if (attempts >= maxAttempts) {
        console.error('Timeout waiting for game to load');
        clearInterval(checkReady);
        reject(new Error('Game load timeout'));
      } else if (attempts % 10 === 0) {
        console.log(`Still waiting for game... (attempt ${attempts}/${maxAttempts})`);
      }
    }, 500);
  });
}

function showWaitingForGame() {
  const statusSection = document.getElementById('status-section');
  const statusDisplay = document.getElementById('status-display');
  if (statusDisplay) {
    statusSection.style.display = 'block';
    statusDisplay.innerHTML = `
      <div style="background: #fff8e1; padding: 12px; border-radius: 4px; border: 1px solid #ffc107;">
        <strong>⏳ Waiting for game...</strong><br>
        <span style="font-size: 12px;">Click "Play" on the Wordle page to activate</span>
      </div>
    `;
  }
}

function showGameLoadError() {
  const statusSection = document.getElementById('status-section');
  const statusDisplay = document.getElementById('status-display');
  if (statusDisplay) {
    statusSection.style.display = 'block';
    statusDisplay.innerHTML = `
      <div style="background: #ffebee; padding: 12px; border-radius: 4px; border: 1px solid #f44336;">
        <strong>⚠️ Game not detected</strong><br>
        <span style="font-size: 12px;">Click "Play" and refresh if needed</span>
      </div>
    `;
  }
}

function activateBuddy() {
  const statusSection = document.getElementById('status-section');
  const statusDisplay = document.getElementById('status-display');
  if (statusDisplay) {
    statusSection.style.display = 'block';
    statusDisplay.innerHTML = `
      <div style="background: #e8f5e9; padding: 12px; border-radius: 4px; border: 1px solid #6aaa64;">
        <strong>✓ Buddy active!</strong>
      </div>
    `;
    setTimeout(() => {
      statusDisplay.innerHTML = '';
      statusSection.style.display = 'none';
    }, 3000);
  }
  
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
    // Settings disabled for now - applyStoredSettings();
    
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

  // Setup settings - DISABLED FOR NOW
  // setupSettings();

  // Toggle panel
  const toggleBtn = document.getElementById('toggle-panel');
  const panelContent = panelElement.querySelector('.panel-content');
  toggleBtn.addEventListener('click', () => {
    panelContent.classList.toggle('collapsed');
    toggleBtn.textContent = panelContent.classList.contains('collapsed') ? '+' : '−';
  });

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
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      // Update position
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
      panelElement.style.left = `${x}px`;
      panelElement.style.top = `${y}px`;
      panelElement.style.right = 'auto';
      panelElement.style.bottom = 'auto';
    }
  });
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

  setInterval(checkGameStateChange, 1000);
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

  // Generate and display permutations
  const permutations = permutationEngine.generatePermutations();
  updatePermutationsDisplay(permutations);

  // Update constraints display
  updateConstraintsDisplay();
}

function updatePermutationsDisplay(permutations) {
  const display = document.getElementById('permutations-display');
  const summary = permutationEngine.getSummary();

  if (permutations.length === 0) {
    display.innerHTML = '<p class="placeholder">Play a word to see permutations</p>';
    return;
  }

  // Special message when only one permutation remains AND it's fully filled
  if (permutations.length === 1 && !permutations[0].includes('_')) {
    const excludedHtml = summary.grays.length > 0
      ? `<p class="permutation-count" style="margin-top: 12px; color: #333;">Excluded: ${summary.grays.sort().join(' ')}</p>`
      : '';
    display.innerHTML = `
      <div style="background: #e8f5e9; padding: 16px; border-radius: 4px; border: 1px solid #6aaa64; text-align: center;">
        <p style="margin: 0; font-size: 15px; font-weight: 600; color: #6aaa64;">✨ You know all you need to know! ✨</p>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: #666;">Put the pieces together for that victorious feeling!</p>
      </div>
      ${excludedHtml}
    `;
    return;
  }

  const maxDisplay = 100;
  const displayPermutations = permutations.slice(0, maxDisplay);
  const hasMore = permutations.length > maxDisplay;

  let html = '<div class="permutation-list">';
  displayPermutations.forEach(perm => {
    html += `<div class="permutation-item">${perm}</div>`;
  });
  html += '</div>';

  // Add count and excluded letters
  if (hasMore) {
    html += `<p class="permutation-count">Showing first ${maxDisplay} of ${permutations.length} permutations</p>`;
  } else if (permutations.length > 1) {
    html += `<p class="permutation-count">${permutations.length} possible permutations</p>`;
  }

  // Add excluded letters if any
  if (summary.grays.length > 0) {
    const excludedText = summary.grays.sort().join(' ');
    html += `<p class="permutation-count" style="margin-top: 4px; color: #333;">Excluded: ${excludedText}</p>`;
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
  zoom: 100,
  colorScheme: 'auto',
  showDetails: true,
  showHeaders: true,
  permFont: 'monospace',
  permSize: 'medium',
  notesFont: 'sans-serif',
  notesSize: 'medium'
};

function setupSettings() {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsOverlay = document.getElementById('settings-overlay');
  const closeSettings = document.getElementById('close-settings');

  settingsBtn.addEventListener('click', () => {
    settingsOverlay.classList.remove('hidden');
    loadSettings();
  });

  closeSettings.addEventListener('click', () => {
    settingsOverlay.classList.add('hidden');
  });

  // Close on overlay click (not content click)
  settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) {
      settingsOverlay.classList.add('hidden');
    }
  });

  // Setup setting change listeners
  document.getElementById('zoom-setting').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('zoom-value').textContent = value + '%';
    applySetting('zoom', value);
  });

  document.getElementById('color-scheme-setting').addEventListener('change', (e) => {
    applySetting('colorScheme', e.target.value);
  });

  document.getElementById('show-details-setting').addEventListener('change', (e) => {
    applySetting('showDetails', e.target.checked);
  });

  document.getElementById('show-headers-setting').addEventListener('change', (e) => {
    applySetting('showHeaders', e.target.checked);
  });

  document.getElementById('perm-font-setting').addEventListener('change', (e) => {
    applySetting('permFont', e.target.value);
  });

  document.getElementById('perm-size-setting').addEventListener('change', (e) => {
    applySetting('permSize', e.target.value);
  });

  document.getElementById('notes-font-setting').addEventListener('change', (e) => {
    applySetting('notesFont', e.target.value);
  });

  document.getElementById('notes-size-setting').addEventListener('change', (e) => {
    applySetting('notesSize', e.target.value);
  });
}

function loadSettings() {
  chrome.storage.local.get(['settings'], (result) => {
    const settings = { ...defaultSettings, ...(result.settings || {}) };
    
    // Update UI controls
    document.getElementById('zoom-setting').value = settings.zoom;
    document.getElementById('zoom-value').textContent = settings.zoom + '%';
    document.getElementById('color-scheme-setting').value = settings.colorScheme;
    document.getElementById('show-details-setting').checked = settings.showDetails;
    document.getElementById('show-headers-setting').checked = settings.showHeaders;
    document.getElementById('perm-font-setting').value = settings.permFont;
    document.getElementById('perm-size-setting').value = settings.permSize;
    document.getElementById('notes-font-setting').value = settings.notesFont;
    document.getElementById('notes-size-setting').value = settings.notesSize;

    // Apply all settings to the panel
    Object.keys(settings).forEach(key => {
      applySettingToUI(key, settings[key]);
    });
  });
}

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

function applySetting(key, value) {
  chrome.storage.local.get(['settings'], (result) => {
    const settings = { ...defaultSettings, ...(result.settings || {}), [key]: value };
    chrome.storage.local.set({ settings });
    applySettingToUI(key, value);
  });
}

function applySettingToUI(key, value) {
  const panel = panelElement;
  
  switch (key) {
    case 'zoom':
      panel.style.fontSize = `${value}%`;
      break;
    
    case 'colorScheme':
      if (value === 'light') {
        panel.style.backgroundColor = 'white';
        panel.style.color = '#333';
      } else if (value === 'dark') {
        panel.style.backgroundColor = '#1a1a1a';
        panel.style.color = '#e0e0e0';
        panel.querySelectorAll('.info-box').forEach(el => {
          el.style.backgroundColor = '#2a2a2a';
          el.style.borderColor = '#444';
        });
        panel.querySelector('.notes-area').style.backgroundColor = '#2a2a2a';
        panel.querySelector('.notes-area').style.color = '#e0e0e0';
        panel.querySelector('.notes-area').style.borderColor = '#444';
      } else {
        // Auto - reset to default
        panel.style.backgroundColor = '';
        panel.style.color = '';
        panel.querySelectorAll('.info-box').forEach(el => {
          el.style.backgroundColor = '';
          el.style.borderColor = '';
        });
        const notesArea = panel.querySelector('.notes-area');
        if (notesArea) {
          notesArea.style.backgroundColor = '';
          notesArea.style.color = '';
          notesArea.style.borderColor = '';
        }
      }
      break;
    
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
        'system': 'system-ui'
      };
      panel.querySelectorAll('.permutation-item').forEach(el => {
        el.style.fontFamily = fontMap[value];
      });
      break;
    
    case 'permSize':
      const permSizeMap = {
        'small': '13px',
        'medium': '15px',
        'large': '18px'
      };
      panel.querySelectorAll('.permutation-item').forEach(el => {
        el.style.fontSize = permSizeMap[value];
      });
      break;
    
    case 'notesFont':
      const notesFontMap = {
        'sans-serif': "'Clear Sans', Arial, sans-serif",
        'monospace': "'Courier New', monospace",
        'system': 'system-ui'
      };
      const notesArea = panel.querySelector('.notes-area');
      if (notesArea) {
        notesArea.style.fontFamily = notesFontMap[value];
      }
      break;
    
    case 'notesSize':
      const notesSizeMap = {
        'small': '12px',
        'medium': '13px',
        'large': '15px'
      };
      const notesTextarea = panel.querySelector('.notes-area');
      if (notesTextarea) {
        notesTextarea.style.fontSize = notesSizeMap[value];
      }
      break;
  }
}
