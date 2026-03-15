import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('mediaRenamer', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (settings: Record<string, unknown>) => ipcRenderer.invoke('set-settings', settings),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  testApiKey: (apiKey: string) => ipcRenderer.invoke('test-api-key', apiKey),
  runManual: () => ipcRenderer.invoke('run-manual'),
});
