import activeWin from 'active-win';
import { BrowserWindow } from 'electron';

export interface WindowInfo {
    title: string;
    id: number;
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    owner: {
        name: string;
        processId: number;
        path: string;
    };
    memoryUsage: number;
}

let lastActiveWindow: string | null = null;
let monitorInterval: NodeJS.Timeout | null = null;

export function startMonitoring(mainWindow: BrowserWindow, floatingBar: BrowserWindow) {
    if (monitorInterval) clearInterval(monitorInterval);

    monitorInterval = setInterval(async () => {
        try {
            const result = await activeWin();
            if (result) {
                const currentId = `${result.owner.name}-${result.title}`;
                if (currentId !== lastActiveWindow) {
                    lastActiveWindow = currentId;

                    let extractedName = result.owner.name.replace(/\\.exe$/i, '');
                    const pathMatch = result.owner.path.match(/([^\\\\]+)\\.exe$/i);
                    if (pathMatch) {
                        extractedName = pathMatch[1];
                    }

                    const windowInfo = {
                        title: result.title,
                        name: extractedName,
                        owner: {
                            name: result.owner.name,
                            processId: result.owner.processId,
                            path: result.owner.path
                        }
                    };

                    console.log(`[WindowMonitor] Change: ${extractedName} ("${result.title}")`);
                    mainWindow.webContents.send('window-change', windowInfo);
                    floatingBar.webContents.send('window-change', windowInfo);
                }
            } else {
                mainWindow.webContents.send('window-change', null);
                floatingBar.webContents.send('window-change', null);
            }
        } catch (err) {
            console.error('Error polling active window:', err);
        }
    }, 500);
}

export function stopMonitoring() {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
    }
}
