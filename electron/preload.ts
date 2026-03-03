import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    // Window Monitoring
    onWindowUpdate: (callback: (data: any) => void) => {
        ipcRenderer.on('window-change', (_event, value) => callback(value));
    },

    // UI Control
    requestWindowList: () => ipcRenderer.invoke('get-window-list'),
    setTargetProcess: (processName: string | null, pid: number | null) => ipcRenderer.send('set-target-process', processName, pid),
    toggleFocusMode: (isEnabled: boolean) => ipcRenderer.send('toggle-focus-mode', isEnabled),
    focusTargetWindow: (processName: string) => ipcRenderer.invoke('focus-window', processName),

    // State Sync
    onStateUpdate: (callback: (data: any) => void) => {
        ipcRenderer.on('state-update', (_event, value) => callback(value));
    },
    updateAppState: (newState: any) => ipcRenderer.send('update-app-state', newState),

    // Gaze State Sync
    sendGazeState: (state: any) => ipcRenderer.send('gaze-state', state),

    // App Actions
    exitApp: () => ipcRenderer.send('exit-app'),
});
