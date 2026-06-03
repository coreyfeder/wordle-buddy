/**
 * Options Page — Settings for Wordle Buddy
 *
 * Reads and writes chrome.storage.local under the key 'settings'.
 * defaultSettings here must stay in sync with the copy in content.js
 * (content.js is the canonical reference for that object).
 */

const defaultSettings = {
  colorScheme: 'auto',
  showDetails: false,
  showHeaders: true,
  permFont: 'monospace',
  permSize: 16,   // pixels
  permBold: false,
  notesFont: 'monospace',
  notesSize: 14,  // pixels
  notesBold: true
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
    updatePermPreview(settings.permFont, settings.permSize, settings.permBold);
    updateNotesPreview(settings.notesFont, settings.notesSize, settings.notesBold);
  });
}

function applyToControls(settings) {
  document.getElementById('color-scheme-setting').value   = settings.colorScheme;
  document.getElementById('show-headers-setting').checked = settings.showHeaders;
  document.getElementById('show-details-setting').checked = settings.showDetails;
  document.getElementById('perm-font-setting').value   = settings.permFont;
  document.getElementById('perm-size-setting').value   = settings.permSize;
  document.getElementById('perm-bold-setting').checked  = settings.permBold;
  document.getElementById('notes-font-setting').value  = settings.notesFont;
  document.getElementById('notes-size-setting').value  = settings.notesSize;
  document.getElementById('notes-bold-setting').checked = settings.notesBold;
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
    const bold = document.getElementById('perm-bold-setting').checked;
    saveSetting('permFont', font);
    updatePermPreview(font, size, bold);
  });

  // Permutations size
  document.getElementById('perm-size-setting').addEventListener('input', (e) => {
    const size = parseInt(e.target.value, 10);
    const font = document.getElementById('perm-font-setting').value;
    const bold = document.getElementById('perm-bold-setting').checked;
    saveSetting('permSize', size);
    updatePermPreview(font, size, bold);
  });

  // Permutations bold
  document.getElementById('perm-bold-setting').addEventListener('change', (e) => {
    const bold = e.target.checked;
    const font = document.getElementById('perm-font-setting').value;
    const size = parseInt(document.getElementById('perm-size-setting').value, 10);
    saveSetting('permBold', bold);
    updatePermPreview(font, size, bold);
  });

  // Notes font
  document.getElementById('notes-font-setting').addEventListener('change', (e) => {
    const font = e.target.value;
    const size = parseInt(document.getElementById('notes-size-setting').value, 10);
    const bold = document.getElementById('notes-bold-setting').checked;
    saveSetting('notesFont', font);
    updateNotesPreview(font, size, bold);
  });

  // Notes size
  document.getElementById('notes-size-setting').addEventListener('input', (e) => {
    const size = parseInt(e.target.value, 10);
    const font = document.getElementById('notes-font-setting').value;
    const bold = document.getElementById('notes-bold-setting').checked;
    saveSetting('notesSize', size);
    updateNotesPreview(font, size, bold);
  });

  // Notes bold
  document.getElementById('notes-bold-setting').addEventListener('change', (e) => {
    const bold = e.target.checked;
    const font = document.getElementById('notes-font-setting').value;
    const size = parseInt(document.getElementById('notes-size-setting').value, 10);
    saveSetting('notesBold', bold);
    updateNotesPreview(font, size, bold);
  });

  // Reset to defaults
  document.getElementById('reset-defaults-btn').addEventListener('click', () => {
    if (!confirm('Reset all settings to defaults? Your notes will not be affected.')) return;
    // Overwrites only the settings key — userNotes, panelPosition, panelSize untouched
    chrome.storage.local.set({ settings: { ...defaultSettings } }, () => {
      applyToControls(defaultSettings);
      updatePermPreview(defaultSettings.permFont, defaultSettings.permSize, defaultSettings.permBold);
      updateNotesPreview(defaultSettings.notesFont, defaultSettings.notesSize, defaultSettings.notesBold);
      showSaveIndicator();
    });
  });
}

// ---------------------------------------------------------------------------
// Live preview
// ---------------------------------------------------------------------------

function updatePermPreview(font, size, bold) {
  const el = document.getElementById('perm-preview');
  el.style.fontFamily  = fontStacks[font] || fontStacks['monospace'];
  el.style.fontSize    = size + 'px';
  el.style.fontWeight  = bold ? '700' : '';
}

function updateNotesPreview(font, size, bold) {
  const el = document.getElementById('notes-preview');
  el.style.fontFamily  = fontStacks[font] || fontStacks['sans-serif'];
  el.style.fontSize    = size + 'px';
  el.style.fontWeight  = bold ? '700' : '';
}

// ---------------------------------------------------------------------------
// Save indicator
// ---------------------------------------------------------------------------

function showSaveIndicator() {
  const indicator = document.getElementById('save-indicator');
  indicator.classList.add('show');
  setTimeout(() => indicator.classList.remove('show'), 2000);
}
