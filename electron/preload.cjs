const { contextBridge, ipcRenderer } = require('electron');

// veilige bridge voor menu-acties
contextBridge.exposeInMainWorld('api', {
  onNewTask(handler) {
    const listener = () => handler();
    ipcRenderer.on('menu:new-task', listener);
    return () => ipcRenderer.removeListener('menu:new-task', listener);
  }
});
