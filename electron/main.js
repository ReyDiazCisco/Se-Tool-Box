/****************************************************
 * electron/main.js
 ****************************************************/
const { app, BrowserWindow } = require('electron');
const { spawn, exec } = require('child_process');
const path = require('path');
const os = require('os');

// We'll use `os.platform()` to detect Windows vs. Mac
let mainWindow = null;
let pyProc = null;

/**
 * On Windows, use taskkill to ensure child processes also die.
 * On macOS/Linux, just kill the child directly (PyInstaller usually doesn't spawn more).
 */
function killProcessTree(pyProcess) {
    if (!pyProcess) return;

    if (os.platform() === 'win32') {
        const pid = pyProcess.pid;
        console.log(`[killProcessTree] taskkill /PID ${pid} /T /F`);

        exec(`taskkill /PID ${pid} /T /F`, (error, stdout, stderr) => {
            if (error) {
                console.error('[taskkill] Error:', error.message);
            } else {
                console.log('[taskkill] Success:', stdout.trim());
            }
        });
    } else {
        // On macOS / Linux, a normal kill is usually enough
        console.log('[killProcessTree] Killing Python process on Mac/Linux...');
        pyProcess.kill('SIGTERM'); // or 'SIGKILL'
    }
}

/**
 * Attempt a graceful /shutdown call (optional).
 */
async function gracefulShutdown() {
    try {
        console.log('[gracefulShutdown] Calling /shutdown endpoint');
        await fetch('http://127.0.0.1:8000/shutdown');
        console.log('[gracefulShutdown] /shutdown call succeeded');
    } catch (err) {
        console.error('[gracefulShutdown] /shutdown error:', err);
    }
}

function startPythonServer() {
    // On Windows: main.exe, otherwise: main
    const exeName = os.platform() === 'win32' ? 'main.exe' : 'main';

    // If dev, read from local dist path; if prod, read from resources
    const isDev = process.env.NODE_ENV === 'development';
    const backendExePath = isDev
        ? path.join(__dirname, '../backend/dist', os.platform() === 'win32' ? 'win' : 'mac', exeName)
        : path.join(process.resourcesPath, 'backend', exeName);

    console.log('[startPythonServer] Spawning from:', backendExePath);

    pyProc = spawn(backendExePath, []);

    pyProc.stdout.on('data', (data) => {
        console.log('[Python stdout]', data.toString());
    });

    pyProc.stderr.on('data', (data) => {
        console.error('[Python stderr]', data.toString());
    });

    pyProc.on('close', (code) => {
        console.log('[Python] Process exited with code:', code);
    });
}

function createWindow() {
    console.log('[createWindow] Creating BrowserWindow...');
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            nodeIntegration: false,
        },
    });

    // Load your compiled React or other frontend
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));

    mainWindow.on('closed', async () => {
        console.log('[mainWindow] closed event fired!');

        if (pyProc) {
            // 1) Attempt graceful shutdown
            await gracefulShutdown();

            // 2) Force kill leftover child processes
            killProcessTree(pyProc);
            pyProc = null;
        }
        mainWindow = null;
    });
}

// Electron lifecycle
app.on('ready', () => {
    console.log('[app] ready event');
    startPythonServer();
    createWindow();
});

app.on('window-all-closed', () => {
    console.log('[app] window-all-closed event');
    if (pyProc) {
        killProcessTree(pyProc);
        pyProc = null;
    }
    if (os.platform() !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    console.log('[app] will-quit event');
    if (pyProc) {
        killProcessTree(pyProc);
        pyProc = null;
    }
});

app.on('activate', () => {
    console.log('[app] activate event');
    if (mainWindow === null) {
        createWindow();
    }
});