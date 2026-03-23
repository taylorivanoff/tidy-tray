import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('mediaRenamer', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (settings: Record<string, unknown>) => ipcRenderer.invoke('set-settings', settings),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  testApiKey: (apiKey: string) => ipcRenderer.invoke('test-api-key', apiKey),
  runManual: () => ipcRenderer.invoke('run-manual'),
  runStructureCheck: () => ipcRenderer.invoke('run-structure-check'),
  openConsole: () => ipcRenderer.invoke('open-console'),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  onLogInit: (cb: (entries: { time: string; level: string; message: string }[]) => void) => {
    ipcRenderer.on('log-init', (_e, entries: { time: string; level: string; message: string }[]) => cb(entries));
  },
  onLog: (cb: (entry: { time: string; level: string; message: string }) => void) => {
    ipcRenderer.on('log', (_e, entry: { time: string; level: string; message: string }) => cb(entry));
  },
  requestLogs: () => ipcRenderer.send('log-request'),
});
