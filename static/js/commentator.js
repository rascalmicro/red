// Extend modes for commentator
// Add commentLine for modes that should have single-line comments or
//  commentStart/commentEnd for multi-line comments
// Only add a single-line delimiter or multi-line delimiters, not both
// Commentator only works on modes with comment delimiters set here
// Note that html code is mode XML and javascript/jsonMode is ignored

/*jshint strict: true */
/*global CodeMirror console */

function initCommentator() {
    "use strict";
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
    "use strict";
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
