// Red tabbed editor with CodeMirror (1 May 2013)
// JSLint 8 Oct 2012 jQuery $ rascal setPictureFrameSize editorSetText saveFile
// saveMsg editorGetText savePreferences initPreferences defaultPreferences

// Editor globals (see also InitEditor and initPreferences)
var ROOT;
var HOME;
var DEFAULT_TEXT;
var editor;
var preferences = { };
var IMAGE_EXTENSIONS = [ 'png', 'jpg', 'jpeg', 'gif', 'ico' ];
var EXCEPTIONS = [];
var DEFAULT_PICTURE = 'static/images/picture_help.png';

function initExceptions () {
    EXCEPTIONS = [ROOT + 'server.py', ROOT + 'static/', ROOT + 'templates/'];
}

// Resize constants
var ADJUSTSIZE = true;
var XW = 16, XH = 0;   // Also works with Ubuntu Chrome XH = 20

// Change tracking (see also red-tabs.js)
var bTrackChanges = false;

// Called from editorSetText (see red-cm.js)
function trackChanges(enable) {
    "use strict";
    if (enable) {
        setFileChanged(false);
        bTrackChanges = true;
    } else {
        bTrackChanges = false;
    }
}

// Only called from fileChanged
function highlightChanged() {
    "use strict";
    var path = ROOT + getPath();
    console.log('highlighting ' + path);
    highlightInTree(path);
    $('#editortabs li.filetab.active > a').addClass('changed');
}

// Also called directly by moveItem (not necessarily active tab)
function highlightInTree(path) {
    "use strict";
    rascal.dnd.changedFiles.push(path);
    console.log('-> ' + JSON.stringify(rascal.dnd.changedFiles));
    $('#filetree li > a[rel="' + path + '"]').addClass('changed');
}

// After displayTree (revert), closeFile and saveComplete (all active tab)
function unhighlightChanged() {
    "use strict";
    var path = ROOT + getPath();
    console.log('unhighlighting ' + path);
    unhighlightInTree(path);
    $('#editortabs li.filetab.active > a').removeClass('changed');
}

// Also called directly by moveItem (not necessarily active tab)
function unhighlightInTree(path) {
    "use strict";
    var i = $.inArray(path, rascal.dnd.changedFiles);
    if (i !== -1) {
        rascal.dnd.changedFiles.splice(i, 1);
        console.log('<- ' + JSON.stringify(rascal.dnd.changedFiles));
    }
    $('#filetree li > a[rel="' + path + '"]').removeClass('changed');
}

// Editor change event
// Sets instance bFileChanged Boolean and highlights file name
// but only if tracking change and not already changed
function fileChanged() {
    "use strict";
    if (bTrackChanges) {
        if (!getFileChanged()) {
            setFileChanged(true);
            highlightChanged();
        }
    }
}

// Utility functions
// Removes 'templates/' at the start of fpath (after root removed)
function pathToUrl(fpath) {
    "use strict";
    var apath;
    if (fpath.match(/^templates\//)) {
        apath = HOME + fpath.split('templates/').pop();
    }
    return apath;
}

// Update browser title
function updateTitle(fpath) {
    "use strict";
    var fname =  fpath.split('/').pop();
    $(document).attr('title', (fname === '') ? 'Editor' : 'Edit - ' +  fname);
}

// fileTree operations
// Load a new picture or file when clicked. For files, change tracking is resumed
function loadFile(path) {
    "use strict";
    var
        ext = path.split('.').pop().toLowerCase(),
        fpath = path.split(ROOT).pop();
    if ($.inArray(ext, IMAGE_EXTENSIONS) >= 0) {
        showPicture(path);
    } else {
        hidePicture();
        $.post('/editor/read', 'path=' + fpath, function (response) {
            console.log('Loading ' + fpath + ' (' + response.length + ')');
            switchToTab(fpath);
            editorSetText(response, ext);
        })
        .error (function (jqXHR, textStatus, errorThrown) {
            console.log('loadFile: ' + textStatus + ': ' + errorThrown);
            saveMsg('Load file failed (' + errorThrown + ')');
        });
    }
}

// The fileTree callback function is executed when the user clicks a file
function displayTree(path) {
    "use strict";
    $('#filetree').fileTree({
        root: ROOT,
        script: '/editor/get_dirlist',
        multiFolder: false,
        expandedPath: path,
        expandOnce: true,
        extendBindTree: rascal.dnd.bindTree
    }, function (path, meta) {
        var fpath = path.split(ROOT).pop(),
            apath;
        // console.log('file click meta ' + meta);
        if (meta && (apath = pathToUrl(fpath))) {
            window.open(apath, '_blank');
        } else if (!fileHasBeenChanged(fpath)) {
            loadFile(path);
        } else {
            switchToTab(fpath);
            querySave.init(QS_REVERT, function (status) {
                if (status === 1) {
                    unhighlightChanged();
                    setFileChanged(false);
                    loadFile(path);
                } else {
                    editor.focus();
                }
            });
        }
    });
}

// Close a file, called after clicking the close icon on a file tab
// Offer to save if file changed
function closeFile() {
    if (!getFileChanged()) {
        closeTab();
    } else {
        querySave.init(QS_SAVE, function (status) {
            if (status === 1) {
                unhighlightChanged();   // Update file list
                closeTab();
            } else {
                editor.focus();
            }
        });
    }
}

// Reload pytronics
// Assumes there is a folder static/log/ and
// a symlink static/log/public.log to /var/log/uwsgi/public.log
function doReload() {
    "use strict";
    var savedPath = $('#path').val(),
        savedText = (savedPath === '') ? editorGetText() : undefined,
        savedCursor = editor.getCursor(),
        savedScroll = editor.getScrollInfo();
    $('#reload-bar').css('width', '0%');
    $.post('/editor/reload', function (response) {
        trackChanges(false);
        clearLocation();
        hidePicture();
        editorSetText('Pytronics is reloading. Please wait...');
        // Wait 15 sec
        $('#reload-progress')
            .addClass('progress-striped')
            .addClass('active');
        $('#reload-bar').animate({ 'width': '100%' }, 15000, function () {
            $('#reload-progress')
                .removeClass('active')
                .removeClass('progress-striped');
            // Check if succeeded, if not show log
            $.post('/datetime', function (response) {
                saveMsg('Reloaded pytronics');
                if (savedPath !== '') {
                    loadFile(savedPath, savedScroll, savedCursor);
                } else {
                    editorSetText(savedText);
                }
            }).error(function (jqXHR, textStatus, errorThrown) {
                saveMsg('Reload pytronics failed - see log');
                loadFile(ROOT + 'static/log/public.log');
            });
        });
    }).error(function (jqXHR, textStatus, errorThrown) {
        console.log('reload: ' + textStatus + ': ' + errorThrown);
        saveMsg('Reload pytronics failed');
    });
}

$('#reload').click(function () {
    "use strict";
    if (!bFileChanged) {
        doReload();
    } else {
        querySave.init(QS_SAVE, function (status) {
            if (status === 1) {
                doReload();
            }
        });
    }
});
