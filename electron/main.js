import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from "electron";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const devServer = process.env.GOODIE_DEV_SERVER;
let windowRef;
let hasUnsavedChanges = false;
let confirmingClose = false;
const filters = [{ name: "GoodieStudio scene", extensions: ["json"] }];

function command(name) {
  if (windowRef && !windowRef.isDestroyed()) windowRef.webContents.send("goodie:command", name);
}

function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: "File", submenu: [
      { label: "New scene", accelerator: "CmdOrCtrl+N", click: () => command("new") },
      { label: "Open scene…", accelerator: "CmdOrCtrl+O", click: () => command("open") },
      { type: "separator" },
      { label: "Export scene…", accelerator: "CmdOrCtrl+S", click: () => command("save") },
      { type: "separator" }, { role: "quit" }
    ]},
    { label: "Edit", submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }] },
    { label: "View", submenu: [{ role: "reload" }, { role: "toggleDevTools" }, { type: "separator" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" }, { role: "togglefullscreen" }] },
    { label: "Help", submenu: [{ label: "GoodieGraphics.js on GitHub", click: () => shell.openExternal("https://github.com/Reaccionador2Jeje/GoodieGraphics.js") }] }
  ]));
}

function registerHandlers() {
  ipcMain.handle("goodie:set-dirty", (_event, dirty) => {
    hasUnsavedChanges = dirty === true;
    return hasUnsavedChanges;
  });
  ipcMain.handle("goodie:open", async () => {
    const result = await dialog.showOpenDialog(windowRef, { title: "Open GoodieStudio scene", properties: ["openFile"], filters });
    if (result.canceled || !result.filePaths[0]) return null;
    return { fileName: path.basename(result.filePaths[0]), content: await readFile(result.filePaths[0], "utf8") };
  });
  ipcMain.handle("goodie:save", async (_event, content, suggestedName) => {
    if (typeof content !== "string" || content.length > 50 * 1024 * 1024) throw new Error("Invalid scene data or file exceeds 50 MB.");
    const defaultPath = typeof suggestedName === "string" && /^[\w .-]+$/.test(suggestedName) ? suggestedName : "goodie-world.goodie.json";
    const result = await dialog.showSaveDialog(windowRef, { title: "Export GoodieStudio scene", defaultPath, filters });
    if (result.canceled || !result.filePath) return false;
    await writeFile(result.filePath, content, "utf8");
    hasUnsavedChanges = false;
    return true;
  });
  ipcMain.handle("goodie:confirm-discard", async () => {
    const result = await dialog.showMessageBox(windowRef, {
      type: "warning", title: "Discard unsaved changes?", message: "Your current scene has unsaved changes.",
      detail: "Export your scene first if you want to keep a copy.",
      buttons: ["Cancel", "Discard changes"], defaultId: 0, cancelId: 0, noLink: true
    });
    return result.response === 1;
  });
  ipcMain.handle("goodie:error", async (_event, message) => dialog.showMessageBox(windowRef, {
    type: "error", title: "GoodieStudio", message: "The operation could not be completed.",
    detail: String(message).slice(0, 2000), buttons: ["OK"]
  }));
}

function createWindow() {
  windowRef = new BrowserWindow({
    width: 1440, height: 920, minWidth: 980, minHeight: 650,
    backgroundColor: "#10151d", title: "GoodieStudio",
    webPreferences: {
      preload: path.join(here, "preload.cjs"),
      contextIsolation: true, nodeIntegration: false, sandbox: true
    }
  });
  windowRef.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  if (devServer) {
    windowRef.loadURL(new URL("/studio.html", devServer).toString());
    windowRef.webContents.openDevTools({ mode: "detach" });
  } else {
    windowRef.loadFile(path.join(here, "../dist/studio.html"));
  }
  windowRef.on("close", (event) => {
    if (!hasUnsavedChanges) return;
    event.preventDefault();
    if (confirmingClose) return;
    confirmingClose = true;
    dialog.showMessageBox(windowRef, {
      type: "warning",
      title: "Unsaved scene",
      message: "GoodieStudio has unsaved changes.",
      detail: "Export your scene before closing, or discard the changes.",
      buttons: ["Cancel", "Discard changes"],
      defaultId: 0,
      cancelId: 0,
      noLink: true
    }).then(({ response }) => {
      confirmingClose = false;
      if (response === 1) {
        hasUnsavedChanges = false;
        if (windowRef && !windowRef.isDestroyed()) windowRef.close();
      }
    }).catch(() => { confirmingClose = false; });
  });
  windowRef.on("closed", () => { windowRef = null; hasUnsavedChanges = false; confirmingClose = false; });
}

app.whenReady().then(() => {
  registerHandlers(); buildMenu(); createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
