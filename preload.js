const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fanGui', {
  start: (mode) => ipcRenderer.invoke('fan:start', mode),
  stop: () => ipcRenderer.invoke('fan:stop'),
  onTick: (fn) => {
    ipcRenderer.on('fan:tick', (_e, payload) => fn(payload));
  },
});
