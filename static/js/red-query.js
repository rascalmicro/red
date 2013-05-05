/* QUERY SAVE FILE AND QUERY DELETE FILE/FOLDER */
// querySave supports optional saving of a changed file when the tab close icon is clicked
// The save file dialog is displayed and wait called asynchronously with status = -1
// If the user chooses to save the file, status is initially 3, dropping to 2 when
// saveFile is called and then 1 when the save completes
// status = 1 for don't save and 0 for cancel
// When status = 1 or 0, the wait ends and the callback function is executed

/*jshint strict: true */
/*global $, window, document, console, setInterval, clearInterval, Blob, rascal, CodeMirror */
/*global moveItem, saveMsg, saveStatus, saveProgress, saveFile */
/*global setFileChanged, getFileChanged, getPath, fileHasBeenChanged, updateLocation,
    anonymousTab, closeTab, getTabFromPath, switchToTab */

// File save
var QS_SAVE = 0,
    QS_REVERT = 1;

var querySave = {
    callback: function (status) {
        "use strict";
    },
    status: -1,
    int_status: undefined,
    wait: function () {
        "use strict";
        var qs = querySave;
        if (qs.status === 3) {
            qs.status = 2;
            saveFile();
        } else if ((qs.status === 1) || (qs.status === 0)) {
            qs.int_status = clearInterval(qs.int_status);
            qs.callback(qs.status);
        } else {
            console.log('querySave: waiting for user');
        }
    },
    init: function (which, callback) {
        "use strict";
        var qs = querySave,
            path = getPath();
        qs.callback = callback;
        qs.status = -1;
        if (which === QS_SAVE) {
            $('#modal-s').modal('show');
            $('#save-file-message').html('Do you want to save the changes you made to the file "' + path + '"?<br/>Your changes will be lost if you don\'t save them.');
        } else {
            $('#modal-r').modal('show');
            $('#revert-file-message').text('Are you sure you want to revert the file "' + path + '" to its original state?');
        }
        qs.int_status = setInterval(querySave.wait, 500);
        qs.wait();
    }
};

// queryDelete supports optional deletion of a file or folder from the file tree
// and works in a similar way to querySave except that it returns 1 for yes and 0 for cancel
var QD_FILE = 0,
    QD_FOLDER = 1;

var queryDelete = {
    callback: function (status) {
        "use strict";
    },
    status: -1,
    int_status: undefined,
    wait: function () {
        "use strict";
        var qd = queryDelete;
        if ((qd.status === 1) || (qd.status === 0)) {
            qd.int_status = clearInterval(qd.int_status);
            qd.callback(qd.status);
        } else {
            console.log('queryDelete: waiting for user');
        }
    },
    init: function (which, path, callback) {
        "use strict";
        var qd = queryDelete;
        qd.callback = callback;
        qd.status = -1;
        $('#modal-d').modal('show');
        // $('#overlay-d').css('visibility', 'visible');
        if (which === QD_FILE) {
            $('#delete-file-message').text('Are you sure you want to delete the file "' + path + '"?');
        } else {
            $('#delete-file-message').text('Are you sure you want to delete the folder "' + path + '"?');
        }
        qd.int_status = setInterval(queryDelete.wait, 500);
        qd.wait();
    }
};
