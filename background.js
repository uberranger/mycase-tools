let activeTabId = null;

chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg.type === 'courts-download-start') {
        activeTabId = sender.tab.id;
    }
});

chrome.downloads.onCreated.addListener((item) => {
    if (!activeTabId || !item.url.includes("courts.in.gov")) return;
    chrome.tabs.sendMessage(activeTabId, { type: 'courts-download' });
});