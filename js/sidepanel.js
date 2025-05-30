chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "closeSidePanel") {
        chrome.sidePanel.close();
    }
});