chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPageData') {
    
    // Using an async IIFE
    // to handle asynchronous operations with async/await syntax
    // while still allowing us to use sendResponse for asynchronous responses.
    (async () => {
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!activeTab) {
          sendResponse({ pageData: null, error: "No active tab found." });
          return;
        }

        // Inject the content script
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ['content.js']
        });

        // Send the message to extract data
        chrome.tabs.sendMessage(activeTab.id, { action: 'extractPageData' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Messaging error:", chrome.runtime.lastError.message);
            sendResponse({ pageData: null, error: chrome.runtime.lastError.message });
          } else {
            sendResponse(response);
          }
        });

      } catch (error) {
        console.error('Failed to inject or execute script:', error);
        sendResponse({ pageData: null, error: error.toString() });
      }
    })();

    // Return true to tell Chrome we will send the response asynchronously
    return true; 
  }

  if (message.action === 'startRegistrationListener') {
    // Check if a listener is already active to prevent duplicates
    chrome.storage.local.get('registrationListenerActive', (result) => {
      if (result.registrationListenerActive) {
        sendResponse({ success: false, alreadyActive: true });
        return;
      }

      // Start listening for tab updates to detect registration completion
      const listener = function(tabId, changeInfo, tab) {
        if (changeInfo.url && changeInfo.url.includes('/control-panel/')) {
          // User navigated to control panel after registration
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.storage.local.set({ registrationListenerActive: false });
          chrome.runtime.sendMessage({ action: 'registrationComplete' });
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      
      // Store the listener reference for cleanup
      chrome.storage.local.set({ registrationListenerActive: true });
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'stopRegistrationListener') {
    chrome.storage.local.set({ registrationListenerActive: false });
    sendResponse({ success: true });
    return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Jam extension installed');
});