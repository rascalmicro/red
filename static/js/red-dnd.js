/* UPLOAD WITH DRAG AND DROP */
// Requires rascal-1.04

/*jshint strict: true */
/*global $, console, rascal */
/*global ROOT, EXCEPTIONS */
/*global editorSetText, editorGetText, editorIsReadOnly */
/*global moveItem, saveMsg, saveProgress */
/*global displayTree */
/*global anonymousTab, closeTab */

function uploadComplete(directory) {
    "use strict";
    console.log('uploadComplete ' + ROOT + directory);
    $('#save-progress')
        .removeClass('active')
        .removeClass('progress-striped');
    saveMsg('Upload complete');
    var dst = ROOT + directory,
        jqDst = $('li.directory > a[rel="' + dst + '"]');
    if (dst === ROOT) {
        displayTree('');
    } else {
        if (jqDst.parent().hasClass('expanded')) {
            jqDst.click();
        }
        jqDst.click();
    }
    if (editorGetText() === '') {
        closeTab();
    }
    console.log('End readOnly ' + editorIsReadOnly());
}

function uploadStatus(msg) {
    "use strict";
    editorSetText(editorGetText() + msg + '\n', 'log');
}

// glue between fileTree dnd and upload
// chrome maps javascript files to text/javascript, firefox to application/x-javascript
function uploadInit(files, dst) {
    "use strict";
    var ru = rascal.upload;
    // set up postUrl, allowed types, progress, status and complete
    ru.postUrl = '/editor/xupload';
    ru.allowAll = false;
    ru.allowedTypes = [ 'image/', 'text/html', 'text/css', 'text/javascript',
        'application/x-javascript', 'text/x-python-script' ];
    ru.progress = saveProgress;
    $('#save-bar').css('width', '0%');
    $('#save-progress')
        .addClass('progress-striped')
        .addClass('active');
    ru.status = uploadStatus;
    ru.complete = uploadComplete;
    anonymousTab('upload status');
    editorSetText('', 'log');
    ru.filesDropped(files, dst.split(ROOT).pop());
}

// Initialise rascal-1.04 drag and drop
function initRascalDnd() {
    "use strict";
    var rd = rascal.dnd;
    rd.root = ROOT;
    rd.containerID = 'filetree';
    rd.notDraggable = EXCEPTIONS;
    rd.itemDropped = moveItem;
    rd.filesDropped = uploadInit;
    rd.init();
}

/* END DND SUPPORT */
