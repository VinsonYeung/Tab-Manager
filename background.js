var tabList;

var allHidden = true;
var windowHidden = true;
var otherHidden = true;
var audibleHidden = true;

getTabs();

function getTabs() {
    tabList = new Array();
    audibleTabList = new Array();
    chrome.windows.getCurrent({}, function(window) {
        chrome.tabs.query({}, function(tabs) {
            for (var i = 0; i < tabs.length; i++) {
                tabList.push({id: tabs[i].id, windowId: window.id, url: tabs[i].url, title: tabs[i].title.replace(/</g, "&lt;").replace(/>/g, "&gt;"), date: new Date()});
            }
        });
    });
}

chrome.tabs.onCreated.addListener(
    function(tab) {
        tabList.push({id: tab.id, windowId: tab.windowId, url: tab.url, title: tab.title.replace(/</g, "&lt;").replace(/>/g, "&gt;"), date: new Date()});
    }
);

chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
        for (var i = 0; i < tabList.length; i++) {
            if (tabList[i].id === tabId) {
                if (changeInfo.status != null || changeInfo.url != null || changeInfo.title != null) {
                    tabList[i].url = tab.url;
                    tabList[i].title = tab.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    tabList[i].date = new Date();
                    tabList.push(tabList[i]);
                    tabList.splice(i, 1);
                }
                break;
            }
        }
    }
);

chrome.tabs.onActivated.addListener(
    function(activeInfo) {
        for (var i = 0; i < tabList.length; i++) {
            if (tabList[i].id === activeInfo.tabId) {
                tabList[i].date = new Date();
                tabList.push(tabList[i]);
                tabList.splice(i, 1);
                break;
            }
        }
    }
);

chrome.tabs.onAttached.addListener(
    function(tabId, attachInfo) {
        for (var i = 0; i < tabList.length; i++) {
            if (tabList[i].id === tabId) {
                tabList[i].windowId = attachInfo.newWindowId;
                tabList[i].date = new Date();
                tabList.push(tabList[i]);
                tabList.splice(i, 1);
                break;
            }
        }
    }
);

chrome.tabs.onRemoved.addListener(
    function(tabId, removeInfo) {
        for (var i = 0; i < tabList.length; i++) {
            if (tabList[i].id === tabId) {
                tabList.splice(i, 1)
                break;
            }
        }
    }
);

chrome.tabs.onReplaced.addListener(
    function(addedTabId, removedTabId) {
        for (var i = 0; i < tabList.length; i++) {
            if (tabList[i].id === removedTabId) {
                tabList[i].id = addedTabId;
                break;
            }
        }
    }
);