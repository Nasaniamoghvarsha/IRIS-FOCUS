import { app, BrowserWindow, ipcMain, screen, session } from 'electron';
import * as path from 'node:path';
import { startMonitoring, stopMonitoring } from './windowMonitor';

import { setupIpcHandlers } from './ipcHandlers';

let mainWindow: BrowserWindow | null = null;
let floatingBar: BrowserWindow | null = null;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
            backgroundThrottling: false,
        }
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        console.log("Loading Dev Server:", process.env.VITE_DEV_SERVER_URL);
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        const indexPath = path.join(__dirname, '../dist/index.html');
        console.log("Loading Production File:", indexPath);
        mainWindow.loadFile(indexPath);
    }

    // mainWindow.webContents.openDevTools();

    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[Renderer] ${message}`);
    });

    mainWindow.once('ready-to-show', () => mainWindow?.show());

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (floatingBar) floatingBar.close();
    });
}

function createFloatingBar() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width } = primaryDisplay.workAreaSize;

    floatingBar = new BrowserWindow({
        width: width,
        height: 60,
        x: 0,
        y: 0,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        resizable: false,
        movable: false,
        skipTaskbar: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
            backgroundThrottling: false,
        }
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        floatingBar.loadURL(`${process.env.VITE_DEV_SERVER_URL}#floating-bar`);
    } else {
        const indexPath = path.join(__dirname, '../dist/index.html');
        floatingBar.loadFile(indexPath, { hash: 'floating-bar' });
    }

    // floatingBar.webContents.openDevTools();

    floatingBar.webContents.on('console-message', (event, level, message) => {
        console.log(`[FloatingBar] ${message}`);
    });

    // Always on top even in full screen
    floatingBar.setAlwaysOnTop(true, 'screen-saver');
}

app.whenReady().then(() => {
    // Handle All Permissions (Debug Mode)
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
        console.log("[Electron] Permission requested:", permission);
        callback(true);
    });
    session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
        console.log("[Electron] Permission check:", permission);
        return true;
    });
    session.defaultSession.setDevicePermissionHandler((details) => {
        console.log("[Electron] Device access:", details.deviceType);
        return true;
    });

    createMainWindow();
    createFloatingBar();

    if (mainWindow && floatingBar) {
        startMonitoring(mainWindow, floatingBar);
        setupIpcHandlers(mainWindow, floatingBar);
    }
});

app.on('window-all-closed', () => {
    stopMonitoring();
    if (process.platform !== 'darwin') app.quit();
});
