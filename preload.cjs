const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('systemAPI', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getStorageInfo: () => ipcRenderer.invoke('get-storage-info'),
  checkDocker: () => ipcRenderer.invoke('check-docker'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  dockerPull: (image) => ipcRenderer.invoke('docker-pull', image),
  readSettings: () => ipcRenderer.invoke('settings:read'),
  writeSettings: (patch) => ipcRenderer.send('settings:write', patch),
  getLaunchAtStartup: () => ipcRenderer.invoke('settings:launch-at-startup'),
  setLaunchAtStartup: (enabled) => ipcRenderer.send('settings:set-launch-at-startup', enabled),
});
