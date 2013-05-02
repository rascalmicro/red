/* SUPPORT FOR TABS */
// There is always at least one tab
// New tabs are cloned from the last (right-hand) tab
// There are two types of tab - those related to a file and anonymous tabs
// Examples of anonymous tabs are 'untitled-1' when the editor is opened and
// tabs opened for messages by drag and drop upload and reload pytronics
// If you delete the last tab, a new anonymous tab is cloned from the last tab
// before it is deleted
//
// Because new tabs are cloned by the addTab() function, there is only one master
// copy of the tab HTML, located in the main editor page. The object named instances
// (see below) holds additional information for each tab, including file path,
// CodeMirror doc and the file changed flag. The master copy of this structure is
// INSTANCE (below) which is cloned by the addInstance() function
//
// When you click a file in the list, one of three things happens:
// 1. If the file is already open, the tab is repopulated. If the editor version has
// unsaved changes, the Revert dialog is shown with the options of Revert or Cancel
// 2. If there is an anonymous tab, it is reused
// 3. Otherwise a new tab is created
//
// When you delete a file in the list and there is a tab open for that file,
// it is deleted (irrespective of whether the editor version has been changed)
//
// When you delete a tab and the editor version has unsaved changes, the Save dialog
// is shown with the options of Save, Cancel or Don't Save

// Tabbed editor instances keyed by tab ID
// Model for instance (to be cloned)
var INSTANCE = {
        fpath: '',
        doc: undefined,
        bFileChanged: false,
        bReadOnly: false
    };

var instances = {};

/*
var activeKey,
    activeInstance;

// This is an accelerator to save looking up the active tab
function setActiveKey(tab) {
    activeKey = tab;
    activeInstance = instances[tab];
}
*/

// Private function
function addInstance(tab, fpath) {
    var i = $.extend({}, INSTANCE);
    i.fpath = fpath;
    instances[tab] = i;
}

/* PUBLIC API */
// Only called from initEditor
function initTabs() {
    addInstance('tab-1', '');
    switchToTab('');
}

// Change tracking
function setFileChanged(what) {
    var tab = $('#editortabs li.filetab.active > a').attr('rel');
//     console.log('> setFileChanged ' + tab + ' ' + what.toString());
    instances[tab].bFileChanged = what;
}

function getFileChanged() {
    var tab = $('#editortabs li.filetab.active > a').attr('rel');
//     console.log('> getFileChanged ' + instances[tab].bFileChanged);
    return instances[tab].bFileChanged;
}

function getPath() {
    var tab = $('#editortabs li.filetab.active > a').attr('rel');
//     console.log('> getPath ' + instances[tab].fpath);
    return instances[tab].fpath;
}

// Called before revert
function fileHasBeenChanged(fpath) {
    var tab, instance;
    for (tab in instances) {
        instance = instances[tab];
        if (instance.fpath === fpath) {
            return instance.bFileChanged;
        }
    }
    return false;
}

// Called after a move
function updateLocation(tab, fpath) {
    $('#editortabs a[rel="' + tab + '"]')
        .attr('title', fpath)
        .text(fpath.split('/').pop());
    instances[tab].fpath = fpath;
}

/* PUBLIC AND PRIVATE */
// Close active tab
// With filetree deletion, could be last tab
function closeTab() {
    "use strict";
    var candidate = $('#editortabs li.filetab.active'),
        key = candidate.children('a').attr('rel'),
        replacement= candidate.prev();
    if (replacement.length === 0) {
        replacement = candidate.next();
        if (replacement.length === 0) {
            addTab('');
            replacement = candidate.next();
        }
    }
    replacement.children('a').tab('show');
    delete instances[key];
    candidate.remove();
}

// Reuse or add an anonymous tab for messages
function anonymousTab(name) {
    if (tab = getTabFromPath('')) {
        $('#editortabs a[rel="' + tab + '"]').tab('show');
    } else {
        tab = addTab('');
    }
    $('#editortabs a[rel="' + tab + '"]').text(name);
}

function getTabFromPath(fpath) {
    var tab, instance;
    for (tab in instances) {
        instance = instances[tab];
        if (instance.fpath === fpath) {
            console.log('+ gtfp [' + fpath + '] => ' + tab);
            return tab;
        }
    }
    console.log('+ gtfp [' + fpath + '] => undefined');
    return undefined;
}

function switchToTab(fpath) {
    var tab, instance;
    console.log('+ switchToTab for [' + fpath + ']');
    if (tab = getTabFromPath(fpath)) {
        console.log('+ switchToTab found ' + tab);
        $('#editortabs a[rel="' + tab + '"]').tab('show');
    } else if (tab = getTabFromPath('')) {
        console.log('+ switchToTab reusing anonymous ' + tab);
        instance = instances[tab]
        instance.fpath = fpath;
        instance.doc = undefined;
        instances.bFileChanged = false;
        $('#editortabs a[rel="' + tab + '"]')
            .attr('title', fpath)
            .text(fpath.split('/').pop())
            .tab('show');
    } else {
        tab = addTab(fpath);
        console.log('+ switchToTab added ' + tab);
    }
    updateTitle(fpath);
//     setActiveKey(tab);
}

/* PRIVATE */
// Create tab for file fpath
// If fpath is the empty string, it creates an anonymous tab
function addTab(fpath) {
    var nextTab = $('li.filetab:last').clone(),
        lastID = nextTab.children('a').attr('rel'),
        nextID = 'tab-' + (parseInt(lastID.split('-').pop(), 10) + 1).toString(),
        fname = fpath.split('/').pop();
    console.log('+ addTab ' + nextID);
    addInstance(nextID, fpath);
    nextTab
        .removeClass('active')
        .children().removeClass();
    nextTab.children('a')
        .attr('rel', nextID)
        .attr('title', fpath)
        .text((fname !== '') ? fname : nextID.replace('tab', 'untitled'));
    $('#editortabs').append(nextTab);
    $('#editortabs a:last').tab('show');
    return nextID;
}

// Called from shown event when tab changes - swap CM docs
function tabShown(e) {
    "use strict";
    var
        prevKey = $(e.relatedTarget).attr('rel'),
        currKey = $(e.target).attr('rel'),
        prevInst = instances[prevKey],
        currInst = instances[currKey];
    console.log('+ tabShown prev ' + prevKey + ', curr ' + currKey);
    if (!currInst.doc) {
        currInst.doc = CodeMirror.Doc(DEFAULT_TEXT);
    }
    hidePicture();
    // Disable highlight active line across swap
    editor.setOption('styleActiveLine', false);
    prevInst.bReadOnly = editorIsReadOnly();
    prevInst.doc = editor.swapDoc(currInst.doc);
    editor.setOption('styleActiveLine', preferences.highlightActive);
    editorSetReadOnly(currInst.bReadOnly);
    editor.focus();
    updateTitle(currInst.fpath);
//     setActiveKey(currKey);
}

/* EVENT HANDLERS */
// Delegated default event handler when tab shown
// $('a[data-toggle="tab"]').on('shown', function (e) {
$('#editortabs').on('shown', 'a[data-toggle="tab"]', function (e) {
    tabShown(e);
});

// Delegated event handler to enable/disable the filetab delete icon
$('#editortabs').on('mouseenter mouseleave', 'li.filetab', function (event) {
    "use strict";
    // Only show the icon when tab is active and there is more than one tab
//     if ($(this).hasClass('active') && ($('li.filetab').length > 1)) {
    // Only show the delete icon when tab is active
    if ($(this).hasClass('active')) {
        if (event.type === 'mouseenter') {
            // console.log('mouseenter');
            $(this).children('img').addClass('selected');
        } else {
            // console.log('mouseleave');
            $(this).children('img').removeClass('selected');
        }
    }
});

// Delegated event handler for clicking the filetab delete icon
$('#editortabs').on('click', 'li.filetab > img', function (event) {
    "use strict";
//     var key = $(this).parent().children('a').attr('rel');
//     console.log('Closing ' + key);
    closeFile();
});
/* END SUPPORT FOR TABS */
