const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("goodieDesktop", Object.freeze({
  isDesktop: true,
  openScene: () => ipcRenderer.invoke("goodie:open"),
  setDirty: (dirty) => ipcRenderer.invoke("goodie:set-dirty", dirty),
  saveScene: (content, name) => ipcRenderer.invoke("goodie:save", content, name),
  confirmNewScene: () => ipcRenderer.invoke("goodie:confirm-new"),
  showError: (message) => ipcRenderer.invoke("goodie:error", message),
  onCommand: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, name) => callback(name);
    ipcRenderer.on("goodie:command", listener);
    return () => ipcRenderer.removeListener("goodie:command", listener);
  }
}));
