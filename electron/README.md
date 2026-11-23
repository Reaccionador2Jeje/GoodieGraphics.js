# GoodieStudio desktop runtime

Electron main-process window, native file dialogs and restricted preload bridge. Run `npm run desktop:dev` from the repository root.

The desktop runtime tracks unsaved scene changes. Closing the window, opening another scene, or creating a new scene asks for confirmation before discarding edits. Successful exports clear the dirty state; canceled exports keep it active.
