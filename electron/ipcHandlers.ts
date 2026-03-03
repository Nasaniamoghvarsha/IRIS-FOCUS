import { ipcMain, app, BrowserWindow } from 'electron';
import activeWin from 'active-win';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export function setupIpcHandlers(mainWindow: BrowserWindow | null, floatingBar: BrowserWindow | null) {
    let appState = {
        selectedProcess: null as string | null,
        selectedPid: null as number | null,
        selectedTitle: null as string | null,
        focusModeEnabled: false,
        irisEnabled: false,
        threshold: 3,
        volume: 0.6
    };

    const broadcastState = () => {
        mainWindow?.webContents.send('state-update', appState);
        floatingBar?.webContents.send('state-update', appState);
    };

    ipcMain.on('set-target-process', (_event, processName, pid) => {
        appState.selectedProcess = processName;
        appState.selectedPid = pid;
        broadcastState();
    });

    ipcMain.on('toggle-focus-mode', (_event, enabled) => {
        appState.focusModeEnabled = enabled;
        if (enabled) {
            // Instead of hiding or moving off-screen, make it tiny and transparent
            // but keep it on screen to prevent suspension
            if (mainWindow) {
                mainWindow.setOpacity(0.05);
                mainWindow.setSize(10, 10);
                mainWindow.setAlwaysOnTop(true, 'screen-saver');
                // Move to corner
                const primaryDisplay = require('electron').screen.getPrimaryDisplay();
                const { width, height } = primaryDisplay.workAreaSize;
                mainWindow.setPosition(width - 20, height - 20);
            }
            floatingBar?.show();
            floatingBar?.moveTop();
        } else {
            floatingBar?.hide();
            if (mainWindow) {
                mainWindow.setOpacity(1.0);
                mainWindow.setSize(1200, 800);
                mainWindow.setAlwaysOnTop(false);
                mainWindow.center();
                mainWindow.focus();
            }
        }
        broadcastState();
    });

    ipcMain.on('update-app-state', (_event, newState) => {
        appState = { ...appState, ...newState };
        broadcastState();
    });

    ipcMain.on('exit-app', () => {
        app.quit();
    });

    // ─── Window List via PowerShell script file ─────────────────────────────
    ipcMain.handle('get-window-list', async () => {
        return new Promise((resolve) => {
            const { exec } = require('child_process');

            // Write the PowerShell script to a temp file to avoid Node.js string interpolation issues
            const scriptContent = [
                'Get-Process |',
                '  Where-Object { $_.MainWindowHandle -ne 0 } |',
                '  ForEach-Object { $_.Name + "|||" + $_.MainWindowTitle + "|||" + $_.Id }',
            ].join('\n');

            const tmpScript = path.join(os.tmpdir(), 'iris_winlist.ps1');
            try {
                fs.writeFileSync(tmpScript, scriptContent, 'utf8');
            } catch (e) {
                console.error('[WindowList] Could not write temp script:', e);
                resolve([]);
                return;
            }

            const command = `powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "${tmpScript}"`;

            exec(command, { maxBuffer: 1024 * 1024 * 5, timeout: 8000 }, (error: any, stdout: string) => {
                // Clean up temp script
                try { fs.unlinkSync(tmpScript); } catch (_) { }

                if (error) {
                    console.error('[WindowList] PS script error:', error.message);
                    resolve([]);
                    return;
                }

                try {
                    const BLOCKED = new Set([
                        'ApplicationFrameHost', 'ShellExperienceHost', 'SystemSettings',
                        'TextInputHost', 'svchost', 'conhost', 'SearchHost', 'StartMenuExperienceHost',
                        'LockApp', 'WinStore.App', 'iris-focus', 'electron', 'node',
                        'Taskmgr', 'SecurityHealthSystray', 'UserOOBEBroker'
                    ]);

                    const lines = stdout.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
                    const seen = new Set<string>();
                    const list: { name: string; title: string; pid: number }[] = [];

                    for (const line of lines) {
                        const parts = line.split('|||');
                        if (parts.length < 3) continue;
                        const rawName = parts[0].trim().replace(/\.exe$/i, '');
                        let title = parts[1].trim();
                        const pid = parseInt(parts[2].trim());

                        // Use process name as fallback if title is empty
                        if (!title) {
                            title = rawName.charAt(0).toUpperCase() + rawName.slice(1);
                        }

                        if (!rawName || isNaN(pid)) continue;
                        if (BLOCKED.has(rawName)) continue;

                        const key = `${rawName.toLowerCase()}-${title.toLowerCase()}`;
                        if (seen.has(key)) continue;
                        seen.add(key);
                        list.push({ name: rawName, title, pid });
                    }

                    console.log(`[WindowList] Found ${list.length} windows`);
                    resolve(list);
                } catch (err) {
                    console.error('[WindowList] Parse error:', err);
                    resolve([]);
                }
            });
        });
    });

    // ─── Focus / Redirect Target Window ──────────────────────────────────────
    ipcMain.handle('focus-window', async (_event, processName: string) => {
        return new Promise((resolve) => {
            const { exec } = require('child_process');

            // SetForegroundWindow via P/Invoke - the ONLY reliable way to activate a window on Windows
            const scriptContent = [
                'Add-Type @"',
                'using System;',
                'using System.Runtime.InteropServices;',
                'public class WinHelper {',
                '  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);',
                '  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);',
                '}',
                '"@',
                `$procs = Get-Process -Name '${processName.replace(/'/g, "''")}' -ErrorAction SilentlyContinue`,
                '$proc = $procs | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1',
                'if ($proc) {',
                '  [WinHelper]::ShowWindow($proc.MainWindowHandle, 9)',
                '  [WinHelper]::SetForegroundWindow($proc.MainWindowHandle)',
                '}'
            ].join('\n');

            const tmpScript = path.join(os.tmpdir(), 'iris_focus.ps1');
            try {
                fs.writeFileSync(tmpScript, scriptContent, 'utf8');
            } catch (e) {
                console.error('[Focus] Could not write temp script:', e);
                resolve(false);
                return;
            }

            const command = `powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "${tmpScript}"`;

            exec(command, { timeout: 8000 }, (error: any) => {
                try { fs.unlinkSync(tmpScript); } catch (_) { }
                if (error) {
                    console.error('[Focus] Failed:', error.message);
                    resolve(false);
                } else {
                    console.log('[Focus] Window activated for:', processName);
                    resolve(true);
                }
            });
        });
    });
}
