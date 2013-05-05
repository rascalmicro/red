/* FILETREE EVENT HANDLERS */
// See red-tabs.js for tab event handlers

/*jshint strict: true */
/*global $, window, document, console, setInterval, clearInterval, Blob, rascal, CodeMirror */
/*global ROOT, HOME, DEFAULT_TEXT, DEFAULT_PICTURE, EXCEPTIONS, editor, preferences */
/*global moveItem, saveMsg, saveStatus, saveProgress, saveFile */
/*global showPicture, hidePicture */
/*global querySave, QS_SAVE, QS_REVERT, queryDelete, QD_FILE, QD_FOLDER */
/*global setFileChanged, getFileChanged, getPath, fileHasBeenChanged, updateLocation,
    anonymousTab, closeTab, getTabFromPath, switchToTab */

// Delegated event handler to enable/disable filetree file selection and the delete icon
$('#filetree').on('mouseenter mouseleave', 'li.file', function (event) {
    "use strict";
    var fpath;
    if (event.type === 'mouseenter') {
        fpath = $(this).children('a').attr('rel');
        $(this).children('a').addClass('selected');
        if ($.inArray(fpath, EXCEPTIONS) === -1) {
            $(this).children('img').addClass('selected');
        }
    } else {
        $(this).children('a').removeClass('selected');
        $(this).children('img').removeClass('selected');
    }
});

// Delegated event handler for clicking the filetab delete icon
$('#filetree').on('click', 'li.file > img', function (event) {
    "use strict";
    var jqel = $(this).parent(),
        path = jqel.children('a').attr('rel'),
        fpath = path.split(ROOT).pop();
    console.log('DELETE click');
    queryDelete.init(QD_FILE, fpath, function (status) {
        if (status === 1) {
            console.log('DELETE ' + fpath);
            hidePicture();
            if (getTabFromPath(fpath)) {
                switchToTab(fpath);
                closeTab();
            }
            $.post('/editor/delete_file', { filename: fpath }, function (response) {
                console.log('DELETE_FILE ' + response);
                jqel.hide('slow');
                saveMsg('Deleted file');
            }).error(function (jqXHR, textStatus, errorThrown) {
                console.log('DELETE_FILE: ' + textStatus + ': ' + errorThrown);
                saveMsg('Delete file failed');
            });
        } else {
            console.log('DELETE cancel');
        }
    });
});

// Delegated event handler to enable/disable the delete icon on an empty folder
$('#filetree').on('mouseenter mouseleave', 'li.directory.expanded', function (event) {
    "use strict";
    var fpath;
    if (event.type === 'mouseenter') {
        if ($(this).children('ul').children().size() === 0) {
            fpath = $(this).children('a').attr('rel');
            if ($.inArray(fpath, EXCEPTIONS) === -1) {
                $(this).children('a').addClass('selected');
                $(this).children('img').addClass('selected');
            }
        }
    } else {
        $(this).children('a').removeClass('selected');
        $(this).children('img').removeClass('selected');
    }
});

// Delegated event handler for clicking the empty folder delete icon
$('#filetree').on('click', 'li.directory.expanded > img', function (event) {
    "use strict";
    var jqel = $(this).parent(),
        path = jqel.children('a').attr('rel'),
        fpath = path.split(ROOT).pop();
    queryDelete.init(QD_FOLDER, fpath, function (status) {
        if (status === 1) {
            console.log('DELETE ' + fpath);
            $.post('/editor/delete_folder', { filename: fpath }, function (response) {
                console.log('DELETE_FOLDER ' + response);
                jqel.hide('slow');
                saveMsg('Deleted folder');
            }).error(function (jqXHR, textStatus, errorThrown) {
                console.log('DELETE_FOLDER: ' + textStatus + ': ' + errorThrown);
                saveMsg('Delete folder failed');
            });
        } else {
            console.log('DELETE cancel');
        }
    });
});

// Delegated event handler for removing empty folder select and delete icon if folder collapsed
$('#filetree').on('mouseenter mouseleave', 'li.directory.collapsed a.selected', function (event) {
    "use strict";
    $(this).removeClass('selected');
    $(this).parent().children('img').removeClass('selected');
});

/* END EVENT HANDLERS */

