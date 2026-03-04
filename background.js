// LeetVault Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('LeetVault extension installed successfully');
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggle' }).catch(err => {
      console.log('Tab not ready:', err);
    });
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-overlay') {
    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle' }).catch(err => {
          console.log('Tab not ready:', err);
        });
      }
    });
  }
});