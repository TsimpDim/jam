chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPageData') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'extractPageData' }, (response) => {
          sendResponse(response);
        });
      } else {
        sendResponse({ pageData: null });
      }
    });
    return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Jam extension installed');
});