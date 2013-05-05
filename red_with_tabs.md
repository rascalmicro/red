red with tabs
============

--

#### WORTH NOTING

* There is always at least one tab. red starts out with an anonymous tab "untitled-1"
* This is anonymous in the sense that it has no file associated with it.
* Anonymous tabs are reused for files or messages.
* Clicking a tab makes it active and loads its content into the editor.
* Clicking an active tab does nothing.
* You can only close the active tab (by clicking the X)
* You can close the last tab but it will be replaced by an anonymous tab.
* The preferred way to dismiss a picture is by clicking it.
* You can open a page from the filetree with Cmd-Click. See `click-test.html` for more information.
* Support for match brackets, close brackets and lint is loaded on demand

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

#### KNOWN ISSUES

* Move folder when one or more of its files is open doesn't update file paths
* Lint only works with CM v3.12, not with later versions (due to CM issues)

#### UNDER CONSIDERATION

* Close all but this tab
* Save all
* Make "jsDocstring" a preference 
* Drag width of filetree
* Automatic loading of modes
* Display fonts as page from font book 

--
Last update 5 May 2013
