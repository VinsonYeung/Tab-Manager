$(document).ready(function() {
    var background = chrome.extension.getBackgroundPage().self;
    var tabList = background.tabList;
    var currentTab;
    chrome.tabs.query({active: true}, function(tabs) {
        currentTab = tabs[0];
    });
    
    displayTabs();

    // Set tables on open
    if (background.allHidden == true) {
        $('#all').hide();
    }
    if (background.windowHidden == true) {
        $('#window').hide();
    }
    if (background.otherHidden == true) {
        $('#other').hide();
    }
    if (background.audibleHidden == true) {
        $('#audible').hide();
    }

    // Open and close tables
    $('#see-all').click(function() {
        background.allHidden = !background.allHidden;
        $('#all').toggle(250);
    });

    $('#see-window').click(function() {
        background.windowHidden = !background.windowHidden;
        $('#window').toggle(250);
    });

    $('#see-other').click(function() {
        background.otherHidden = !background.otherHidden;
        $('#other').toggle(250);
    });

    $('#see-audible').click(function() {
        background.audibleHidden = !background.audibleHidden;
        $('#audible').toggle(250);
    });

    // Tab selecion
    $(document).on("click", 'tr.tab', function() {
        if ($(this).hasClass('selected')) {
            $('.selected').removeClass('selected');
        } else {
            $('.selected').removeClass('selected');
            $(this).addClass('selected');
        }
    });

    // Focus tab
    $('#focus-tab').click(function() {
        for (var i = 0; i < tabList.length; i++) {
            if (tabList[i].id == parseInt($('.selected').data('tab-id'))) {
                chrome.windows.update(tabList[i].windowId, {focused: true});
                chrome.tabs.update(parseInt(tabList[i].id), {active: true});
                break;
            }
        }
    });

    // Mute tab
    $('#mute-tab').click(function() {
        if ($('.selected').hasClass('muted')) {
            chrome.tabs.update($('.selected').data('tab-id'), {muted: false});
            $('[data-tab-id="' + $('.selected').data('tab-id') + '"]').removeClass('muted');
        } else {
            chrome.tabs.update($('.selected').data('tab-id'), {muted: true});
            $('[data-tab-id="' + $('.selected').data('tab-id') + '"]').addClass('muted');
        }
    });

    // Discard tab
    $('#discard-tab').click(function() {
        if ($('.selected').hasClass('discarded')) {
            // Switch tab to load before switching back
            chrome.tabs.update($('.selected').data('tab-id'), {active: true});
            chrome.tabs.update(currentTab.id, {active: true});
            $('[data-tab-id="' + $('.selected').data('tab-id') + '"]').removeClass('discarded');
        } else {
            chrome.tabs.discard($('.selected').data('tab-id'));
            $('[data-tab-id="' + $('.selected').data('tab-id') + '"]').addClass('discarded');
        }
    });

    // Close tab
    $('#close-tab').click(function() {
        chrome.tabs.remove(parseInt($('.selected').data('tab-id')));
        $('[data-tab-id="' + $('.selected').data('tab-id') + '"]').remove();
    });

    // Find phrase
    $('#find').click(function() {
        $('#view-all').hide();
        $('#view-search').empty();
        $('#view-search').append('<span>Results: ' + $('#search').val() + '</span>');
        $('#view-search').append("<table id='search-result'><tr><th>windowId</th><th>Title</th><th class='date'>Last Accessed</th></tr></table>");
        for (var i = 0; i < tabList.length; i++) {
            // Create asynchronous index number
            let index = i;
            // Check page uses http or https
            if (!tabList[index].url.startsWith('http')) {
                continue;
            }
            chrome.tabs.get(tabList[index].id, function(tab) {
                if (tab.discarded) {
                    if (tabList[index].title.toLowerCase().search($('#search').val().toLowerCase()) == -1) {
                        return;
                    }
                    $('#search-result').append("<tr class='tab' data-tab-id='" + tabList[index].id + "'><td>" + tabList[index].windowId + "</td><td class='title'>" + tabList[index].title + "<span id='discarded-tag' class='tag'></span><span id='muted-tag' class='tag'></span></td><td>" + timeDifference(tabList[index].date) + "</td></tr>");
                } else {
                    chrome.tabs.executeScript(tabList[index].id, {code: "(document.title + document.body.innerText).toLowerCase();"}, function(result) {
                        if (result[0].search($('#search').val().toLowerCase()) == -1) {
                            return;
                        }
                        $('#search-result').append("<tr class='tab' data-tab-id='" + tabList[index].id + "'><td>" + tabList[index].windowId + "</td><td class='title'>" + tabList[index].title + "<span id='discarded-tag' class='tag'></span><span id='muted-tag' class='tag'></span></td><td>" + timeDifference(tabList[index].date) + "</td></tr>");
                    });
                }
            });
        }
        // Add muted class
        chrome.tabs.query({muted: true}, function(tabs) {
            for (var i = 0; i < tabs.length; i++) {
                $('[data-tab-id="' + tabs[i].id + '"]').addClass('muted');
            }
        });

        $('#view-search').append('<span id="return"><strong>Return</strong></span>');

        // Add discarded class
        chrome.tabs.query({discarded: true}, function(tabs) {
            if (tabs.length > 0) {
                $('#view-search').append('<p>The text you are searching for might be in a discarded page. Load discarded pages to enable text searching.</p>');
            }
            for (var i = 0; i < tabs.length; i++) {
                $('[data-tab-id="' + tabs[i].id + '"]').addClass('discarded');
            }
        });
    });

    // Return view
    $(document).on('click', '#return', function() {
        $('#view-search').empty();
        $('#view-all').show();
    });

    // Load all
    $('#load-all').click(function() {
        for (var i = 0; i < tabList.length; i++) {
            // Create asynchronous index number
            let index = i;
            // Load all discarded tabs
            chrome.tabs.query({discarded: true}, function(tabs) {
                for (var j = 0; j < tabs.length; j++) {
                    chrome.tabs.update(tabs[j].id, {active: true});
                    chrome.tabs.update(currentTab.id, {active: true});
                }
            });
        }
    });
    
    chrome.tabs.onReplaced.addListener(
        function(addedTabId, removedTabId) {
            $('[data-tab-id="' + removedTabId + '"]').data('tab-id', addedTabId);
            $('[data-tab-id="' + removedTabId + '"]').attr('data-tab-id', addedTabId);
        }
    );

    function displayTabs() {
        for (var i = 0; i < tabList.length; i++) {
            $('#all').append("<tr class='tab' data-tab-id='" + tabList[i].id + "'><td>" + tabList[i].windowId + "</td><td class='title'><img src='" + tabList[i].favicon + "' width='14' height='14'>" + tabList[i].title + "<span id='discarded-tag' class='tag'></span><span id='muted-tag' class='tag'></span></td><td>" + timeDifference(tabList[i].date) + "</td></tr>");
        }
    
        chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
            for (var i = 0; i < tabList.length; i++) {
                if (tab[0].windowId == tabList[i].windowId) {
                    $('#window').append("<tr class='tab' data-tab-id='" + tabList[i].id + "'><td class='title'><img src='" + tabList[i].favicon + "' width='14' height='14'>" + tabList[i].title + "<span id='discarded-tag' class='tag'></span><span id='muted-tag' class='tag'></span></td><td>" + timeDifference(tabList[i].date) + "</td></tr>");
                }
            }
    
            for (var i = 0; i < tabList.length; i++) {
                if (tab[0].windowId != tabList[i].windowId) {
                    $('#other').append("<tr class='tab' data-tab-id='" + tabList[i].id + "'><td>" + tabList[i].windowId + "</td><td class='title'><img src='" + tabList[i].favicon + "' width='14' height='14'>" + tabList[i].title + "<span id='discarded-tag' class='tag'></span><span id='muted-tag' class='tag'></span></td><td>" + timeDifference(tabList[i].date) + "</td></tr>");
                }
            }
        });

        chrome.tabs.query({audible: true}, function(tabs) {
            for (var i = 0; i < tabList.length; i++) {
                for (var j = 0; j < tabs.length; j++) {
                    if (tabList[i].id == tabs[j].id) {
                        $('#audible').append("<tr class='tab' data-tab-id='" + tabList[i].id + "'><td>" + tabList[i].windowId + "</td><td class='title'><img src='" + tabList[i].favicon + "' width='14' height='14'>" + tabList[i].title + "<span id='discarded-tag' class='tag'></span><span id='muted-tag' class='tag'></span></td><td>" + timeDifference(tabList[i].date) + "</td></tr>");
                        break;
                    }
                }
            }
        });

        // Add muted class
        chrome.tabs.query({muted: true}, function(tabs) {
            for (var i = 0; i < tabs.length; i++) {
                $('[data-tab-id="' + tabs[i].id + '"]').addClass('muted');
            }
        });

        // Add discarded class
        chrome.tabs.query({discarded: true}, function(tabs) {
            for (var i = 0; i < tabs.length; i++) {
                $('[data-tab-id="' + tabs[i].id + '"]').addClass('discarded');
            }
        });
    }
});

function timeDifference(date) {
    var currentTime = new Date();
    var seconds = Math.floor((currentTime.getTime() - date.getTime()) / 1000);

    if (seconds >= 7200) {
        return Math.floor(seconds / 3600) + " hours";
    } else if (seconds >= 3600) {
        return "1 hour";
    } else if (seconds >= 120) {
        return Math.floor(seconds / 60) + " minutes";
    } else if (seconds >= 60) {
        return "1 minute";
    } else if (seconds == 1) {
        return "1 second";
    } else {
        return seconds + " seconds";
    }
}
