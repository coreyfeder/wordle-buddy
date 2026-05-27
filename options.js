/**
 * Options Page - Settings for Wordle Buddy
 * 
 * This script will handle:
 * - Loading settings from chrome.storage.local
 * - Updating UI controls with saved values
 * - Saving changes when user modifies settings
 * - Live preview updates
 * - Visual feedback for saves
 */

console.log('Wordle Buddy options page loaded');

// Default settings (must match content.js)
const defaultSettings = {
  zoom: 100,
  colorScheme: 'auto',
  showDetails: true,
  showHeaders: true,
  permFont: 'monospace',
  permSize: 16,  // Now a number (pixels)
  notesFont: 'sans-serif',
  notesSize: 14  // Now a number (pixels)
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

function init() {
  console.log('Initializing options page...');
  
  // TODO: Load saved settings
  // TODO: Set up event listeners
  // TODO: Update preview elements
  
  console.log('Options page ready');
}

// TODO: Implement functions:
// - loadSettings()
// - saveSettings()
// - updatePreview()
// - showSaveIndicator()
