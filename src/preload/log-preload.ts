import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  onLogInit: (cb: (entries: { time: string; level: string; message: string }[]) => void) => {
    ipcRenderer.on('log-init', (_e, entries: { time: string; level: string; message: string }[]) => cb(entries));
  },
  onLog: (cb: (entry: { time: string; level: string; message: string }) => void) => {
    ipcRenderer.on('log', (_e, entry: { time: string; level: string; message: string }) => cb(entry));
  },
  requestLogs: () => ipcRenderer.send('log-request'),
});
