/* MODAL DIALOG HANDLING */

/*jshint strict: true */
/*global $, console, rascal */
/*global ROOT, EXCEPTIONS, preferences */
/*global displayTree */
/*global saveMsg, moveItem */
/*global initPreferences, defaultPreferences, savePreferences */
/*global querySave, queryDelete */
/*global getPath */

// Create template
var template_title = {
    html: 'Create a new template',
    doctab: 'Create a new template',
    markdown: 'Create a new template',
    python: 'Create a new template',
    other: 'Create a new file'
};

var template_message = {
    html: 'The name you type should end in .html',
    doctab: 'The name you type should end in .html',
    markdown: 'The name you type should end in .md',
    python: 'The name you type should end in .py',
    other: 'The name will usually end in .css or .js'
};

var template_note = {
    html: 'Create an HTML template in the templates folder',
    doctab: 'Create an HTML template with a Docs tab in the templates folder',
    markdown: 'Create a Markdown template in the templates/docs folder',
    python: 'Create a Python file in the top-level directory',
    other: 'Create an empty file in the static folder. You will be able to drag it to another folder.'
};

var template_btn = {
    html: 'Create template',
    doctab: 'Create template',
    markdown: 'Create template',
    python: 'Create template',
    other: 'Create file'
};

$('#new-template').click(function () {
    "use strict";
    $('#template-title').text(template_title.html);
    $('#template-message').text(template_message.html)
        .removeClass('warning');
    $('#template-name').val('');
    $('#template-note small').text(template_note.html);
    $('#docHTML').attr('checked', true);
    $('#modal-t').modal('show');
});

$('#modal-t').on('shown', function () {
    "use strict";
    $('#template-name').focus();
});

$('#template-create').click(function (e) {
    "use strict";
    var
        templateName = $('#template-name').val().trim(),
        templateOption = $('#template-radios input:radio:checked').attr('value'),
        path;
    e.preventDefault();
    if (templateName !== '') {
        // If no extension provided, add one for files in the templates folder
        if (templateName.indexOf('.') === -1) {
            switch (templateOption) {
            case 'html':
            case 'doctab':
                templateName += '.html';
                break;
            case 'markdown':
                templateName += '.md';
                break;
            case 'python':
                templateName += '.py';
                break;
            }
        }
        $.post('/editor/new_template', { templateName: templateName,
                templateOption: templateOption }, function (response) {
            switch (templateOption) {
            case 'html':
            case 'doctab':
                path = ROOT + 'templates/';
                break;
            case 'markdown':
                path = ROOT + 'templates/docs/';
                break;
            case 'python':
                path = ROOT;
                break;
            default:
                path = ROOT + 'static/';
            }
            console.log('new_template: ' + path);
            displayTree(path);
            $('#modal-t').modal('hide');
        }).error(function (jqXHR, textStatus, errorThrown) {
            console.log('new_template: ' + textStatus + ': ' + errorThrown);
            if (errorThrown === 'CONFLICT') {
                $('#template-message').text('Template exists - please use a different name')
                    .addClass('warning');
            } else {    // 'Bad Request'
                $('#template-message').text('Template could not be created')
                    .addClass('warning');
            }
            $('#template-name').focus();
        });
    } else {
        $('#template-name').focus();
    }
});

$('#template-radios input:radio').click(function () {
    "use strict";
    var val = $(this).attr('value');
    $('#template-title').text(template_title[val]);
    $('#template-message').text(template_message[val]);
    $('#template-note small').text(template_note[val]);
    $('#template-create').text(template_btn[val]);
    $('#template-name').focus();
});

$('#template-cancel').click(function (e) {
    "use strict";
    e.preventDefault();
    $('#modal-t').modal('hide');
});

// Create folder
$('#new-folder').click(function () {
    "use strict";
    $('#folder-message').text('You will be able to drag it to another folder')
        .removeClass('warning');
    $('#folder-name').val('');
    $('#modal-f').modal('show');
});

$('#modal-f').on('shown', function () {
    "use strict";
    $('#folder-name').focus();
});

$('#folder-create').click(function (e) {
    "use strict";
    var folderName = $('#folder-name').val().trim();
     e.preventDefault();
   if (folderName !== '') {
        $.post('/editor/new_folder', { folderName: folderName }, function (response) {
            console.log(response);
            displayTree(ROOT + 'static/');
            $('#modal-f').modal('hide');
        }).error(function (jqXHR, textStatus, errorThrown) {
            console.log('new_folder: ' + textStatus + ': ' + errorThrown);
            if (errorThrown === 'CONFLICT') {
                $('#folder-message').text('Folder exists - please use a different name')
                    .addClass('warning');
            } else {    // 'Bad Request'
                $('#folder-message').text('Folder could not be created (mkdir returned an error)')
                    .addClass('warning');
            }
            $('#folder-name').focus();
        });
    } else {
        $('#folder-name').focus();
    }
});

$('#folder-cancel').click(function (e) {
    "use strict";
    e.preventDefault();
    $('#modal-f').modal('hide');
});

// Rename file
$('#rename-file').click(function () {
    "use strict";
    var fpath = (rascal.picture.showing) ? rascal.picture.fpath : getPath(),
        filename;
    if (fpath === '') {
        saveMsg('Select a file');
    } else if ($.inArray(ROOT + fpath, EXCEPTIONS) !== -1) {
        saveMsg('Cannot rename');
    } else {
        filename = fpath.split('/').pop();
        $('#rename-message').text('Enter a new name for "' + filename + '"')
            .removeClass('warning');
        $('#rename-name').val(filename);
        $('#modal-n').modal('show');
    }
});

$('#modal-n').on('shown', function () {
    "use strict";
    $('#rename-name').focus();
});

function renameOrCopy (copy) {
    "use strict";
    var fpath = (rascal.picture.showing) ? rascal.picture.fpath : getPath(),
        oldName = fpath.split('/').pop(),
        srcDirs = (oldName === fpath) ? '' : fpath.match(/.*\//)[0],
        newName = $('#rename-name').val().trim();

    console.log('oldName ' + oldName);
    console.log('srcDirs ' + srcDirs);
    console.log('newName ' + newName);

    if (newName === '') {
        $('#rename-message').text('Please enter a new name for this file')
            .addClass('warning');
        $('#rename-name').focus();
    } else if (newName === oldName) {
        $('#rename-message').text('Please enter a different name for this file')
            .addClass('warning');
        $('#rename-name').focus();
    } else {
        $('#modal-n').modal('hide');
        moveItem(ROOT + fpath, ROOT + srcDirs + newName, copy);
    }
}

$('#rename-yes').click(function (e) {
    "use strict";
    e.preventDefault();
    renameOrCopy(false);
});

$('#rename-copy').click(function (e) {
    "use strict";
    e.preventDefault();
    renameOrCopy(true);
});

$('#rename-cancel').click(function (e) {
    "use strict";
    e.preventDefault();
    $('#modal-n').modal('hide');
});

// Preferences
$('#preferences').click(function () {
    "use strict";
    $('#modal-p').modal('show');
    console.log('Preferences ' + JSON.stringify(preferences));
});

$('#prefs-save').click(function (e) {
    "use strict";
    e.preventDefault();
    $('#modal-p').modal('hide');
    savePreferences();
});

$('#prefs-cancel').click(function (e) {
    "use strict";
    e.preventDefault();
    $('#modal-p').modal('hide');
    initPreferences();
});

$('#prefs-defaults').click(function (e) {
    "use strict";
    e.preventDefault();
    defaultPreferences();
});

$('#save-yes').click(function (e) {
    "use strict";
    e.preventDefault();
    querySave.status = 3;
    $('#modal-s').modal('hide');
});

// Query save
$('#save-no').click(function (e) {
    "use strict";
    e.preventDefault();
    querySave.status = 1;
    $('#modal-s').modal('hide');
});

$('#save-cancel').click(function (e) {
    "use strict";
    e.preventDefault();
    querySave.status = 0;
    $('#modal-s').modal('hide');
});

// Revert file
$('#revert-yes').click(function (e) {
    "use strict";
    e.preventDefault();
    querySave.status = 1;
    $('#modal-r').modal('hide');
});

$('#revert-cancel').click(function (e) {
    "use strict";
    e.preventDefault();
    querySave.status = 0;
    $('#modal-r').modal('hide');
});

// Delete file or folder
$('#delete-yes').click(function (e) {
    "use strict";
    e.preventDefault();
    queryDelete.status = 1;
    $('#modal-d').modal('hide');
});

$('#delete-cancel').click(function (e) {
    "use strict";
    e.preventDefault();
    queryDelete.status = 0;
    $('#modal-d').modal('hide');
});
/* END OF MODAL DIALOG HANDLING */
