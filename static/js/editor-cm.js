// Support for CodeMirror2
// JSLint 8 Oct 2012 jQuery $ applyTheme applyFontSize applyLineHeight applyTabSize
// applySoftTabs applyVisibleTabs applyIndentUnit applyLineNumbers applyHighlightActive
// applyLineWrapping applyMatchBrackets CodeMirror editor trackChanges fileChanged preferences

var prefs = {
    defaults: {
        theme: 'blackboard',
        fontSize: 12,
        lineHeight: 1.4,
        tabSize: 4,
        softTabs: true,
        visibleTabs: false,
        indentUnit: 4,
        lineNumbers: false,
        highlightActive: true,
        lineWrapping: false,
        matchBrackets: false
    },
    types: {
        theme: 'string',
        fontSize: 'int',
        lineHeight: 'float',
        tabSize: 'int',
        softTabs: 'boolean',
        visibleTabs: 'boolean',
        indentUnit: 'int',
        lineNumbers: 'boolean',
        highlightActive: 'boolean',
        lineWrapping: 'boolean',
        matchBrackets: 'boolean'
    },
    apply: {
        theme: applyTheme,
        fontSize: applyFontSize,
        lineHeight: applyLineHeight,
        tabSize: applyTabSize,
        softTabs: applySoftTabs,
        visibleTabs: applyVisibleTabs,
        indentUnit: applyIndentUnit,
        lineNumbers: applyLineNumbers,
        highlightActive: applyHighlightActive,
        lineWrapping: applyLineWrapping,
        matchBrackets: applyMatchBrackets
    }
};

function setPictureFrameSize(frp) {
    "use strict";
    frp.height($('.CodeMirror-scroll').height())
        .width($('.CodeMirror-scroll').width());
}

// Used to identify version specific changes (set by initEditor)
var cmVersion;

// Support for highlighting active line
var hlActive = false;
var hlLine = null;
var hlLineStyle = "activeline-default";

function activeline() {
    if (hlActive) {
        if (hlLine !== null) {
            if (cmVersion === 2) {
                editor.setLineClass(hlLine, null, null);
            } else {
                editor.removeLineClass(hlLine, null, hlLineStyle);
            }
        } else {
            console.log('WARNING activeline: hlLine is null');
        }
        if (cmVersion === 2) {
            hlLine = editor.setLineClass(editor.getCursor().line, null, hlLineStyle);
        } else {
            hlLine = editor.addLineClass(editor.getCursor().line, null, hlLineStyle);
        }
    }
}

// Initialise editor with soft tabs
function softTabs(cm) {
    "use strict";
    var ch, ts, ns;
    if (cm.somethingSelected()) {
        cm.indentSelection("add");
    } else {
        ch = cm.coordsChar(cm.cursorCoords(true)).ch;
        ts = cm.getOption('tabSize');
        ns = ts - (ch % ts);
        // console.log('softTabs: inserting ' + ns + ' spaces');
        cm.replaceSelection(new Array(ns + 1).join(' '), "end");
    }
}

// Format JSON
function formatJSON(cm) {
    "use strict";
    var mode, s, o, t;
    mode = cm.getOption('mode');
    if ((mode != null) && typeof (mode === 'object') && (mode.json)) {
        console.log('formatJSON true');
        try {
            s = cm.getValue();
            o = JSON.parse(s);
            t = JSON.stringify(o, null, cm.getOption('tabSize'));
            if (t === s) {
                saveMsg('Checked JSON');
            } else {
                saveMsg('Formatted JSON');
                cm.setValue(t);
           }
        }
        catch (e) {
            saveStatus('JSON ' + e.toString());
        }
    } else {
         console.log('formatJSON false');
    }
}

// Extend modes for commentator
// Add commentLine for modes that should have single-line comments or
//  commentStart/commentEnd for multi-line comments
// Only add a single-line delimiter or multi-line delimiters, not both
// Commentator only works on modes with comment delimiters set here
// Note that html code is mode XML and javascript/jsonMode is ignored
function initCommentator() {
    CodeMirror.extendMode("xml", {
        commentStart: "<!-- ",
        commentEnd: " -->"
    });
    CodeMirror.extendMode("css", {
        commentStart: "/* ",
        commentEnd: " */"
    });
    CodeMirror.extendMode("javascript", {
        commentLine: '// ',
        commentStart: "/* ",
        commentEnd: " */"
    });
    CodeMirror.extendMode("python", {
        commentLine: '# ',
        commentStart: '""" ',
        commentEnd: ' """'
    });
}

// Comment or uncomment a single line or block of code
// Click on a line or make a selection, then type Cmd-/
function commentator(cm) {
    var
        start = cm.getCursor('start'),
        end = cm.getCursor('end'),
        curMode = CodeMirror.innerMode(cm.getMode(), cm.getTokenAt(start).state).mode,
        name = curMode.name,
        commentLine = curMode.commentLine,
        commentStart = curMode.commentStart,
        commentEnd = curMode.commentEnd,
        jsDocstring = false,
        startText, trimText, cStart,
        currentLine,
        args = {
            oneLine: true,
            block: false,
            empty: true,
            notEmpty: false
        };

    function commentSingleLine(line, oneLine) {
        var
            delimiter = commentLine,
            text = cm.getLine(line),
            wsBefore = '';
        if (oneLine) {
            wsBefore = /^\s*/.exec(text);
            text = text.replace(/^\s*/, '');
        }
        if (text.indexOf(delimiter, 0) === 0) {
            text = text.substring(delimiter.length);
        } else {
            text = delimiter + text;
        }
        cm.setLine(line, wsBefore + text);
    }

    function commentSelection(empty) {
        var
            delStart = commentStart,
            delEnd = commentEnd,
            text = cm.getSelection();
        // If not jsDocstring, revert to single line comment for empty lines
        if (empty && (name === 'javascript') && !jsDocstring) {
            delStart = commentLine;
            delEnd = '';
        }
        if (text.indexOf(delStart, 0) === 0) {
            if (text.indexOf(delEnd, text.length - delEnd.length) !== -1) {
                text = text.substring(delStart.length, text.length - delEnd.length);
            }
        } else {
            text = delStart + text + delEnd;
        }
        cm.replaceSelection(text);
        if (empty) {
            cm.setSelection({line: start.line, ch: start.ch + delStart.length});
        }
    }

    // console.log('start ' + JSON.stringify(start));
    // console.log('end ' + JSON.stringify(end));
    // console.log(curMode);
     console.log('commentator: ' + name);

    // If mode is commentable
    if (commentLine || commentStart) {
        // Ignore javascript JSON mode
        if ((name === 'javascript') && curMode.jsonMode) {
            console.log('commentator: ignoring JSON mode');
            return;
        }

        if (start.line === end.line && start.ch === end.ch) {

            // If no selection
            startText = cm.getLine(start.line);
            trimText = startText.trim();

            if ((trimText.length === 0) && commentStart) {
                // If line is empty and multi-line comments available, leave cursor in
                // comment (useful for py docstring, maybe for javascript)
                commentSelection(args.empty);
            } else if (commentStart &&
                    (trimText.indexOf(commentStart, 0) === 0) &&
                    (trimText.indexOf(commentEnd, trimText.length - commentEnd.length !== -1))) {
                // If line is just a multi-line comment, select and uncomment it
                cStart = startText.indexOf(commentStart, 0);
                cm.setSelection({line: start.line, ch: cStart},
                    {line: start.line, ch: cStart + trimText.length});
                commentSelection(args.notEmpty);
            } else if (commentLine) {
                // Comment/uncomment single line even if indented
                commentSingleLine(start.line, args.oneLine && (start.ch !== 0));
            } else {
                // Turn into to a selection
                cm.setSelection({line: start.line, ch: 0}, {line: start.line, ch: null});
                commentSelection(args.notEmpty);
            }

        } else {

            // There is a selection
            if ((commentLine && (start.ch === 0)) || !commentStart) {
                // Single-line comments are preferred for selections from start of line
                if (start.line === end.line &&
                    ((name === 'python') || ((name === 'javascript') && jsDocstring))) {
                    // If python or jsDocstring, make single line selection an exception
                    commentSelection(args.notEmpty);
                } else {
                    // Extend selection to whole lines
                    if (end.ch !== 0) {
                        end.line += 1;
                        end.ch = 0;
                    }
                    // Iterate over selected lines
                    currentLine = start.line;
                    while (currentLine < end.line) {
                        commentSingleLine(currentLine, args.block);
                        currentLine += 1;
                    }
                    cm.setSelection(start, end);
                }
            } else {
                // multi-line comment
                commentSelection(args.notEmpty);
            }

        }
    }
}

function initEditor(root, home) {
    ROOT = root;
    HOME = home;
    console.log('Root: ' + ROOT);
    console.log('Home: ' + HOME);
    // The next line fixes a dangerous bug in Firefox Mac 18.0.2
    $('#path').val('');
    trackChanges(false);
    editor = CodeMirror.fromTextArea(document.getElementById('code'), {
        mode: 'text', // text mode doesn't exist explicitly, but setting it provokes plain text by default
        theme: 'default',
        tabSize: 4,
        indentUnit: 4,
        indentWithTabs: false,
        extraKeys: {
            "Tab": softTabs,
            "Cmd-J": formatJSON,
            "Ctrl-J": formatJSON,
            "Cmd-/": commentator
        }
//        onCursorActivity: activeline
//        electricChars: false,
//        onChange: fileChanged
    });
    initCommentator();
    if (CodeMirror.version !== undefined) {
        console.log('CodeMirror version: ' + CodeMirror.version);
        cmVersion = parseInt(CodeMirror.version, 10);
    } else {
        console.log('CodeMirror version: v2.33 or earlier');
        cmVersion = 2;
    }
    if (cmVersion === 2) {
        $('.CodeMirror-scroll').height(475);
        editor.setOption('fixedGutter', true);
        editor.setOption('onCursorActivity', activeline);
        editor.setOption('onChange', fileChanged);
    } else {
        $('.CodeMirror').height(475);
        editor.on('cursorActivity', activeline);
        editor.on('change', fileChanged);
    }
}

//   CodeMirror.defaults = {
//     value: "",
//     mode: null,
//     theme: "default",
//     indentUnit: 2,
//     indentWithTabs: false,
//     smartIndent: true,
//     tabSize: 4,
//     keyMap: "default",
//     extraKeys: null,
//     electricChars: true,
//     autoClearEmptyLines: false,
//     onKeyEvent: null,
//     onDragEvent: null,
//     lineWrapping: false,
//     lineNumbers: false,
//     gutter: false,
//     fixedGutter: false,
//     firstLineNumber: 1,
//     readOnly: false,
//     dragDrop: true,
//     onChange: null,
//     onCursorActivity: null,
//     onGutterClick: null,
//     onHighlightComplete: null,
//     onUpdate: null,
//     onFocus: null, onBlur: null, onScroll: null,
//     matchBrackets: false,
//     workTime: 100,
//     workDelay: 200,
//     pollInterval: 100,
//     undoDepth: 40,
//     tabindex: null,
//     autofocus: null
//   };

function editorSetMode(ext) {
    "use strict";
    var mode;
    switch (ext.toLowerCase()) {
    case 'c':
        mode = 'text/x-csrc';
        break;
    case 'css':
        mode = 'css';
        break;
    case 'js':
        mode = 'javascript';
        break;
    case 'json':
        mode = {name: 'javascript', json: true};
        break;
    case 'py':
        mode = 'python';
        break;
    case 'html':
    case 'mako':
    case 'xml':
        mode = 'htmlmixed';
        break;
    case 'less':
        mode = 'less';
        break;
    case 'markdown':
    case 'md':
        mode = 'markdown';
        break;
    case 'log':
        mode = 'log';
        break;
    case 'rb':
        mode = 'ruby';
        break;
    default:
        mode = 'text';
    }
    console.log('mode ' + mode);
    editor.setOption('mode', mode);
    editor.setOption('readOnly', (ext === 'log'));
}

function editorSetText(s, ext) {
    "use strict";
    if (ext === undefined) {
        ext = 'txt';
    }
    // Fix to ensure activeLine is updated when loading a new file
    editor.setValue(' ');
    editor.setCursor(0, 1);
    // End fix
    editor.setValue(s);
    editorSetMode(ext);
}

function editorGetText() {
    "use strict";
    return editor.getValue();
}

function isReadOnly() {
    return editor.getOption('readOnly');
}

var THEMES = ['default', 'night', 'solarized-light', 'solarized-dark'];

// Manage preferences
function applyTheme() {
    "use strict";
    var oldTheme = editor.getOption('theme'),
        newTheme;
    // console.log('applyTheme ' + preferences.theme);
    editor.setOption('theme', preferences.theme);
    // Set theme for other panes
    if ($.inArray(preferences.theme, THEMES) >= 0) {
        newTheme = preferences.theme;
    } else {
        newTheme = 'blackboard';
    }
    $('#ft-background')
        .removeClass('rm-well-' + oldTheme)
        .addClass('rm-well-' + newTheme);
    $('#filetree')
        .removeClass('filetree-' + oldTheme)
        .addClass('filetree-' + newTheme);
    $('#new-file-folder-bar')
        .removeClass('rm-well-' + oldTheme)
        .addClass('rm-well-' + newTheme);
    $('#location-bar')
        .removeClass('rm-well-' + oldTheme)
        .addClass('rm-well-' + newTheme);

    // Set active line highlight color
    hlLineStyle = 'activeline-' + newTheme;
    // console.log('+ hlLineStyle ' + hlLineStyle);
    if (preferences.highlightActive) {
        if (hlLine !== null) {
            activeline();
        }
    }
}

function applyFontSize() {
    "use strict";
    // console.log('applyFontSize ' + preferences.fontSize);
    $('.CodeMirror').css('font-size', preferences.fontSize + 'px');
}

function applyLineHeight() {
    "use strict";
    // console.log('applyLineHeight ' + preferences.lineHeight);
    $('.CodeMirror').css('line-height', preferences.lineHeight + 'em');
}

function applyTabSize() {
    "use strict";
    // console.log('applyTabSize ' + preferences.tabSize);
    editor.setOption('tabSize', preferences.tabSize);
}

function applySoftTabs() {
    "use strict";
    var ek = editor.getOption('extraKeys');
    // console.log('applySoftTabs ' + preferences.softTabs);
    if (ek !== null) {
        if (ek.Tab !== null) {
            // console.log('+ deleting tab property');
            delete ek.Tab;
        }
        if (preferences.softTabs) {
            // console.log('+ adding tab property softTabs');
            ek.Tab = softTabs;
        }
        editor.setOption('extraKeys', ek);
    } else {
        if (preferences.softTabs) {
            // console.log('+ creating tab property softTabs');
            editor.setOption('extraKeys', {'Tab': softTabs});
        }
    }
    // console.log('+ set indentWithTabs ' + !preferences.softTabs);
    editor.setOption('indentWithTabs', !preferences.softTabs);
}

function applyVisibleTabs() {
    "use strict";
    // console.log('applyVisibleTabs ' + preferences.visibleTabs);
    if (preferences.visibleTabs) {
        $('.CodeMirror').addClass('visibleTabs');
    } else {
        $('.CodeMirror').removeClass('visibleTabs');
    }
}

function applyIndentUnit() {
    "use strict";
    // console.log('applyIndentUnit ' + preferences.indentUnit);
    editor.setOption('indentUnit', preferences.indentUnit);
}

function applyLineNumbers() {
    "use strict";
    // console.log('applyLineNumbers ' + preferences.lineNumbers);
    editor.setOption('lineNumbers', preferences.lineNumbers);
}

function applyHighlightActive() {
    "use strict";
    // console.log('applyHighlightActive ' + preferences.highlightActive);
    if (preferences.highlightActive !== hlActive) {
        hlActive = preferences.highlightActive;
        if (hlActive) {
            // console.log('+ turning on hlActive');
            if (cmVersion === 2) {
                hlLine = editor.setLineClass(editor.getCursor().line, null, hlLineStyle);
            } else {
                hlLine = editor.addLineClass(editor.getCursor().line, null, hlLineStyle);
            }
        } else {
            // console.log('+ turning off hlActive');
            // Clear current highlight
            if (hlLine !== null) {
                if (cmVersion === 2) {
                    editor.setLineClass(hlLine, null, null);
                } else {
                    editor.removeLineClass(hlLine, null, null);
                }
            } else {
                console.log('+ WARNING hlLine is null');
            }
        }
    }
}

function applyLineWrapping() {
    "use strict";
    // console.log('applyLineWrapping ' + preferences.lineWrapping);
    editor.setOption('lineWrapping', preferences.lineWrapping);
}

function applyMatchBrackets() {
    "use strict";
    // console.log('applyMatchBrackets ' + preferences.matchBrackets);
    if ((cmVersion !== 2) && (editor.getOption('matchBrackets') === undefined)) {
        console.log('CM version 3: loading matchbrackets.js');
        $.getScript('/editor/static/codemirror/lib/util/matchbrackets.js', function () {
            editor.setOption('matchBrackets', preferences.matchBrackets);
        });
    } else {
        editor.setOption('matchBrackets', preferences.matchBrackets);
    }
}

function setTheme() {
    "use strict";
    preferences.theme = $(this).val();
    prefs.apply.theme();
    // editor.refresh();   // CodeMirror needs this to recalculate layout
}

function setFontSize() {
    "use strict";
    preferences.fontSize = $(this).val();
    prefs.apply.fontSize();
}

function setLineHeight() {
    "use strict";
    preferences.lineHeight = $(this).val();
    prefs.apply.lineHeight();
}

function setTabSize() {
    "use strict";
    preferences.tabSize = parseInt($(this).val(), 10);
    prefs.apply.tabSize();
}

function setSoftTabs() {
    "use strict";
    preferences.softTabs = $(this).is(':checked');
    prefs.apply.softTabs();
}

function setVisibleTabs() {
    "use strict";
    preferences.visibleTabs = $(this).is(':checked');
    prefs.apply.visibleTabs();
}

function setIndentUnit() {
    "use strict";
    preferences.indentUnit = parseInt($(this).val(), 10);
    prefs.apply.indentUnit();
}

function setLineNumbers() {
    "use strict";
    preferences.lineNumbers = $(this).is(':checked');
    prefs.apply.lineNumbers();
}

function setHighlightActive() {
    "use strict";
    preferences.highlightActive = $(this).is(':checked');
    prefs.apply.highlightActive();
}

function setLineWrapping() {
    "use strict";
    preferences.lineWrapping = $(this).is(':checked');
    prefs.apply.lineWrapping();
}

function setMatchBrackets() {
    "use strict";
    preferences.matchBrackets = $(this).is(':checked');
    prefs.apply.matchBrackets();
}

function bindEditPreferences() {
    "use strict";
    $('#theme').change(setTheme)
        .each(function () {
            $(this).val(preferences.theme);
        });
    $('#fontSize').change(setFontSize)
        .each(function () {
            this.value = preferences.fontSize;
        });
    $('#lineHeight').change(setLineHeight)
        .each(function () {
            this.value = preferences.lineHeight;
        });
    $('#tabSize').change(setTabSize)
        .each(function () {
            this.value = preferences.tabSize;
        });
    $('#softTabs').change(setSoftTabs)
        .each(function () {
            this.checked = preferences.softTabs;
        });
    $('#visibleTabs').change(setVisibleTabs)
        .each(function () {
            this.checked = preferences.visibleTabs;
        });
    $('#indentUnit').change(setIndentUnit)
        .each(function () {
            this.value = preferences.indentUnit;
        });
    $('#lineNumbers').click(setLineNumbers)
        .each(function () {
            this.checked = preferences.lineNumbers;
        });
    $('#highlightActive').click(setHighlightActive)
        .each(function () {
            this.checked = preferences.highlightActive;
        });
    $('#lineWrapping').click(setLineWrapping)
        .each(function () {
            this.checked = preferences.lineWrapping;
        });
    $('#matchBrackets').click(setMatchBrackets)
        .each(function () {
            this.checked = preferences.matchBrackets;
        });
}

function applyAll() {
    var pa = prefs.apply, f;
    for (f in pa) {
        if (pa.hasOwnProperty(f)) {
            pa[f]();
        }
    }
}

function savePreferences() {
    "use strict";
    $.post('/editor/save_prefs', { section: 'CodeMirror', prefs: JSON.stringify(preferences) }, function (response) {
        // console.log('save_prefs ' + response);
    });
}

function defaultPreferences() {
    var pd = prefs.defaults, p;
    for (p in pd) {
        if (pd.hasOwnProperty(p)) {
            // console.log('Restoring default ' + p + ': ' + pd[p]);
            preferences[p] = pd[p];
        }
    }
    applyAll();
    bindEditPreferences();
}

function initPreferences() {
    "use strict";
    $.post('/editor/read_prefs', { section: 'CodeMirror', types: JSON.stringify(prefs.types),
            defaults: JSON.stringify(prefs.defaults)}, function (response) {
        preferences = JSON.parse(response);
        applyAll();
        bindEditPreferences();
    });
}
