/**
 * Options Page — Settings for Wordle Buddy
 *
 * Reads and writes chrome.storage.local under the key 'settings'.
 * defaultSettings here must stay in sync with the copy in content.js
 * (content.js is the canonical reference for that object).
 */

const defaultSettings = {
  zoom: 100,
  colorScheme: 'auto',
  showDetails: true,
  showHeaders: true,
  permFont: 'monospace',
  permSize: 16,   // pixels
  notesFont: 'sans-serif',
  notesSize: 14   // pixels
};

// Font stacks shared by preview and (via content.js) the panel.
const fontStacks = {
  monospace:  "'Courier New', monospace",
  'sans-serif': "'Clear Sans', Arial, sans-serif",
  serif:      'Georgia, serif'
};

document.addEventListener('DOMContentLoaded', init);

function init() {
  loadSettings();
  setupListeners();
}

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

function loadSettings() {
  chrome.storage.local.get(['settings'], (result) => {
    const settings = { ...defaultSettings, ...(result.settings || {}) };
    applyToControls(settings);
    updatePermPreview(settings.permFont, settings.permSize);
    updateNotesPreview(settings.notesFont, settings.notesSize);
  });
}

function applyToControls(settings) {
  document.getElementById('zoom-setting').value        = settings.zoom;
  document.getElementById('zoom-value').textContent    = settings.zoom + '%';
  document.getElementById('color-scheme-setting').value  = settings.colorScheme;
  document.getElementById('show-headers-setting').checked = settings.showHeaders;
  document.getElementById('show-details-setting').checked = settings.showDetails;
  document.getElementById('perm-font-setting').value   = settings.permFont;
  document.getElementById('perm-size-setting').value   = settings.permSize;
  document.getElementById('notes-font-setting').value  = settings.notesFont;
  document.getElementById('notes-size-setting').value  = settings.notesSize;
}

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

function saveSetting(key, value) {
  chrome.storage.local.get(['settings'], (result) => {
    const settings = { ...defaultSettings, ...(result.settings || {}), [key]: value };
    chrome.storage.local.set({ settings }, showSaveIndicator);
  });
}

// ---------------------------------------------------------------------------
// Event listeners
// ---------------------------------------------------------------------------

function setupListeners() {
  // Zoom
  document.getElementById('zoom-setting').addEventListener('input', (e) => {
    const value = parseInt(e.target.value, 10);
    document.getElementById('zoom-value').textContent = value + '%';
    saveSetting('zoom', value);
  });

  // Color scheme
  document.getElementById('color-scheme-setting').addEventListener('change', (e) => {
    saveSetting('colorScheme', e.target.value);
  });

  // Show section headers
  document.getElementById('show-headers-setting').addEventListener('change', (e) => {
    saveSetting('showHeaders', e.target.checked);
  });

  // Show constraint details
  document.getElementById('show-details-setting').addEventListener('change', (e) => {
    saveSetting('showDetails', e.target.checked);
  });

  // Permutations font
  document.getElementById('perm-font-setting').addEventListener('change', (e) => {
    const font = e.target.value;
    const size = parseInt(document.getElementById('perm-size-setting').value, 10);
    saveSetting('permFont', font);
    updatePermPreview(font, size);
  });

  // Permutations size
  document.getElementById('perm-size-setting').addEventListener('input', (e) => {
    const size = parseInt(e.target.value, 10);
    const font = document.getElementById('perm-font-setting').value;
    saveSetting('permSize', size);
    updatePermPreview(font, size);
  });

  // Notes font
  document.getElementById('notes-font-setting').addEventListener('change', (e) => {
    const font = e.target.value;
    const size = parseInt(document.getElementById('notes-size-setting').value, 10);
    saveSetting('notesFont', font);
    updateNotesPreview(font, size);
  });

  // Notes size
  document.getElementById('notes-size-setting').addEventListener('input', (e) => {
    const size = parseInt(e.target.value, 10);
    const font = document.getElementById('notes-font-setting').value;
    saveSetting('notesSize', size);
    updateNotesPreview(font, size);
  });
}

// ---------------------------------------------------------------------------
// Live preview
// ---------------------------------------------------------------------------

function updatePermPreview(font, size) {
  const el = document.getElementById('perm-preview');
  el.style.fontFamily = fontStacks[font] || fontStacks['monospace'];
  el.style.fontSize   = size + 'px';
}

function updateNotesPreview(font, size) {
  const el = document.getElementById('notes-preview');
  el.style.fontFamily = fontStacks[font] || fontStacks['sans-serif'];
  el.style.fontSize   = size + 'px';
}

// ---------------------------------------------------------------------------
// Save indicator
// ---------------------------------------------------------------------------

function showSaveIndicator() {
  const indicator = document.getElementById('save-indicator');
  indicator.classList.add('show');
  setTimeout(() => indicator.classList.remove('show'), 2000);
}
