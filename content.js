// LeetVault Content Script
(function() {
  'use strict';
  
  if (window.leetVaultInitialized) return;
  window.leetVaultInitialized = true;
  
  let leetVault;
  let initAttempts = 0;
  const maxAttempts = 3;
  
  function init() {
    try {
      if (typeof LeetVaultUI === 'undefined' || typeof LeetVaultDB === 'undefined') {
        initAttempts++;
        if (initAttempts < maxAttempts) {
          setTimeout(init, 100);
          return;
        }
        console.error('LeetVault: Required classes not loaded');
        return;
      }
      
      leetVault = new LeetVaultUI();
      leetVault.init();
      console.log('LeetVault initialized successfully');
    } catch (error) {
      console.error('LeetVault initialization failed:', error);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(init, 100);
    });
  } else {
    setTimeout(init, 100);
  }
})();