red with tabs
============

--

#### WORTH NOTING

* There is only one editor with many documents, each held in a tab.
* There is always at least one tab. red starts out with an anonymous tab "untitled".
* This is anonymous in the sense that it has no file associated with it.
* Anonymous tabs are reused for files or messages. There can be zero or one of them.
* Clicking a tab makes it active and loads its content into the editor.
* Clicking an active tab does nothing.
* You can close any tab (by clicking its close icon).
* Shift-click an active tab close icon to close all but the active tab.
* You can close the last tab. It will be replaced by an anonymous tab.
* The preferred way to dismiss a picture is by clicking it.
* Shift-click Save or type Shift-Cmd/Ctrl-S to Save All changed files.
* You can open a page by dragging its tab to the browser address bar or to a tab.
* You can also open a page from the filetree with Cmd-Click. See `click-test.html` for more information.
* Support for match brackets, close brackets and lint is loaded on demand
* Red help (click the lightbulb icon)

#### DONE

* Upload - make status read only and track by tab (will also apply to log and Reload Pytronics)
* Factor out JS into separate files
* Change default shown handler to delegated
* Reduce tab height  (padding-top/bottom currently reduced from 8px to 4px)
* Multiple highlighting of filetree
* Rename, copy or move picture or file (many use cases)
* Go back to allowing spaces in file and folder names (use  secure path instead of secure folder)
* Consolidate styles
* Reload pytronics
* Close brackets (preference)
* Lint for JavaScript and JSON (preference)
* Incorporated latest CM fixes for lint gutter (requires this [CM commit][cm])
* Close all but this tab
* Red help
* Save All (hold down Shift while clicking Save or typing Cmd/Ctrl-S)
* Can now close non-active tab where doc has changed (shows querySave)
* Improved tab appearance

#### KNOWN ISSUES

* Move folder when one or more of its files is open doesn't update file paths

#### UNDER CONSIDERATION

* Make "jsDocstring" a preference 
* Drag width of filetree
* Automatic loading of modes
* Display fonts as page from font book 

--
Last update 15 May 2013

[cm]: https://github.com/marijnh/CodeMirror/commit/a48b5d71cd30c58808f359a9c604dac89d9b2ba6