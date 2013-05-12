/* FILE OPERATIONS */

/*jshint strict: true */
/*global $, document, console, Blob, rascal */
/*global ROOT, DEFAULT_TEXT */
/*global editorGetText, editorSetText, editorIsReadOnly */
/*global highlightInTree, unhighlightChanged, unhighlightInTree, displayTree */
/*global showPicture */
/*global querySave */
/*global getTabFromPath, fileHasBeenChanged, updateLocation, setFileChanged,
    getFileChanged, getPath, anonymousTab, saveAll */

// Move a file or folder (initiated by DnD), rename a file (initiated from dialog)
//  moveItem /var/www/public/templates/foo.html /var/www/public/static/
//  moveItem /var/www/public/static/empty/ /var/www/public/templates/
//  moveItem /var/www/public/templates/foo.html /var/www/public/templates/bar.html
function moveItem(src, dst, copy) {
    "use strict";
    var tab;
    copy = copy || false;
    console.log('moveItem ' + src + ' ' + dst);
    $.post('/editor/move_item', { src: src, dst: dst, copy: copy.toString() }, function (response) {
        var srcDirs = (src.match(/.*\//)[0]).split('/'),
            dstDirs = (dst.match(/.*\//)[0]).split('/'),
            dstDir = dstDirs.join('/'),
            jqDst = $('li.directory > a[rel="' + dstDir + '"]'),
            bDstIsFile = (dst.split('/').pop() !== ''),
            srcFpath = src.split(ROOT).pop();
        // If src is a directory, reduce by one
        if (srcDirs.join('/') === src) {
            srcDirs.pop();
        }
        // Optimise redisplay of fileTree
        if (dstDir === ROOT) {
            console.log('move to top');
            displayTree(src);
        } else if (srcDirs.length === dstDirs.length) {
            console.log('optimise equal paths');
            $('li > a[rel="' + src + '"]').hide('slow');
            if (bDstIsFile) {
                jqDst.click();
            }
            jqDst.click();
        } else if (srcDirs.length < dstDirs.length) {
            console.log('optimise deeper');
            if (jqDst.parent().hasClass('expanded')) {
                jqDst.click();
            }
            $('li > a[rel="' + src + '"]').hide('slow');
            jqDst.click();
        } else {
            console.log('optimise shallower');
            if (jqDst.parent().hasClass('expanded')) {
                jqDst.click();
            }
            jqDst.click();
        }
        // If relevant, update tabs and fileTree
        if (!copy) {
            if (rascal.picture.showing) {
                if (bDstIsFile) {
                    showPicture(dst);
                } else {
                    showPicture(dst + src.split('/').pop());
                }
            } else if ((tab = getTabFromPath(srcFpath))) {
                if (bDstIsFile) {
                    if (fileHasBeenChanged(srcFpath)) {
                        unhighlightInTree(src);
                        highlightInTree(dst);
                    }
                    updateLocation(tab, dst.split(ROOT).pop());
                } else {
                    if (fileHasBeenChanged(srcFpath)) {
                        unhighlightInTree(src);
                        highlightInTree(dst + src.split('/').pop());
                    }
                    updateLocation(tab, (dst + src.split('/').pop()).split(ROOT).pop());
                }
            }
        }
    }).error(function (jqXHR, textStatus, errorThrown) {
        console.log('moveItem: ' + textStatus + ': ' + errorThrown);
        saveMsg('Move failed');
    });
}

/* SAVE FILE */
// dsmall 12 Apr 2013 - new version of saveFile using rascal.upload
// requires rascal-1.04.js
//  new variable rascal.upload.allowAll (default false)
//  if allowAll is true, allow any mime type to be uploaded
//  send allowAll in new xhr header 'X-AllowAll'
// depends on editor.py
//  in procedure xupload_file() obtain value of allowAll
//  if allowAll is true, allow any file extension to be saved

function saveMsg(msg) {
    "use strict";
    $('#save-message').text(msg)
        .stop(true)
        .css('visibility', 'visible')
        .hide()
        .fadeTo(500, 1)
        .delay(1500)
        .fadeTo(2000, 0);
}

// Called after all files have been uploaded
function saveComplete(directory) {
    "use strict";
    var savedFiles;
    $('#save-progress')
        .removeClass('active')
        .removeClass('progress-striped');
    if (querySave.status === 2) {
        querySave.status = 1;
    }
    if ((savedFiles = rascal.upload.savedFiles) === 1) {
        saveMsg('Saved file');
    } else {
        saveMsg('Saved ' + savedFiles.toString() + ' files');
    }
    // console.log('saveComplete');
}

// Called after a file has been uploaded
function saveUploaded(file, dst) {
    "use strict";
    var fpath = dst + file,
        tab = getTabFromPath(fpath);
    console.log('Uploaded ' + fpath);
    $('#editortabs li.filetab > a[rel="' + tab + '"]').removeClass('changed');
    unhighlightInTree(ROOT + fpath);
    setFileChanged(false, tab);
}

// Called if there has been an error
function saveStatus(msg) {
    "use strict";
    anonymousTab('status');
    editorSetText(msg, 'log');
}

function saveProgress(pc) {
    "use strict";
    // console.log('progress ' + pc);
    $('#save-bar').css('width', pc + '%');
}

function saveInit(files, dst) {
    "use strict";
    var ru = rascal.upload;
    // set up postUrl, allowed types, progress, status and complete
    ru.postUrl = '/editor/xupload';
    ru.allowAll = true;
    ru.progress = saveProgress;
    $('#save-bar').css('width', '0%');
    $('#save-progress')
        .addClass('progress-striped')
        .addClass('active');
    ru.status = saveStatus;
    ru.uploaded = saveUploaded;
    ru.complete = saveComplete;
    ru.filesDropped(files, dst);
}

function saveFile() {
    "use strict";
    var p = getPath(),
        s = editorGetText(),
        files,
        blob,
        f,
        dst;
    if (editorIsReadOnly()) {
        saveMsg('File is read only');
    } else if (p === '') {
        saveMsg(DEFAULT_TEXT);
    } else {
        console.log('Saving ' + p + ' (' + s.length + ')');
        f = p.split('/').pop();
        dst = p.replace(f, '');
        blob = new Blob([s], {type: 'text'});
        blob.name = f;
        files = { 0: blob, length: 1};
        // console.log(files);
        saveInit(files, dst);
    }
}

function saveOneOrAll(all) {
    "use strict";
    console.log('SaveAll ' + all);
    if (rascal.picture.showing) {
        saveMsg('Can\'t save pictures');
    } else if (all) {
        saveAll();
    } else {
        saveFile();
    }
}

// Function for binding ctrl keystrokes from Ganeshji Marwaha:
// http://www.gmarwaha.com/blog/2009/06/16/ctrl-key-combination-simple-jquery-plugin/
$.ctrl = function (key, callback, args) {
    "use strict";
    $(document).keydown(function (e) {
        if (!args) {
            args = [];  // IE barks when args is null
        }
        // if (e.keyCode === key.charCodeAt(0) && e.ctrlKey) {
        if (e.keyCode === key.charCodeAt(0) && (e.ctrlKey || e.metaKey)) {
            args = [ e.shiftKey ];
            callback.apply(this, args);
            return false;
        }
    });
};

$.ctrl('S', function (all) {
    "use strict";
    console.log('ctrl-S ' + all);
    saveOneOrAll(all);
});

$('#save').click(function (e) {
    "use strict";
    saveOneOrAll(e.shiftKey);
});
/* END OF SAVE FILE */
