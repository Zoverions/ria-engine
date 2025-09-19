const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const Store = require('electron-store');

// Initialize secure storage
const store = new Store({
  encryptionKey: 'ria-trading-desktop-encryption-key',
  name: 'ria-trading-config'
});

// Keep a global reference of the window object
let mainWindow;
let isDev = false;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false, // Don't show until ready
    backgroundColor: '#1a1a2e'
  });

        // Load the production app
        mainWindow.loadFile(path.join(__dirname, 'renderer', 'production-index.html'));  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Wallet',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-wallet');
          }
        },
        {
          label: 'Import Wallet',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.send('menu-action', 'import-wallet');
          }
        },
        {
          label: 'Export Wallet',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-action', 'export-wallet');
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('menu-action', 'settings');
          }
        },
        { type: 'separator' },
        {
          role: 'quit'
        }
      ]
    },
    {
      label: 'Trading',
      submenu: [
        {
          label: 'Start RIA Enhanced Bot',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.send('menu-action', 'start-ria-bot');
          }
        },
        {
          label: 'Stop RIA Bot',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            mainWindow.webContents.send('menu-action', 'stop-ria-bot');
          }
        },
        { type: 'separator' },
        {
          label: 'Start Trading',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow.webContents.send('menu-action', 'start-trading');
          }
        },
        {
          label: 'Stop Trading',
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => {
            mainWindow.webContents.send('menu-action', 'stop-trading');
          }
        },
        { type: 'separator' },
        {
          label: 'Refresh Historical Data',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            mainWindow.webContents.send('menu-action', 'refresh-data');
          }
        },
        { type: 'separator' },
        {
          label: 'Run Backtest',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow.webContents.send('menu-action', 'run-backtest');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About RIA Trading Desktop',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About RIA Trading Desktop',
              message: 'RIA Enhanced Trading Desktop',
              detail: 'Complete Windows Trading Application\\nVersion 2.0.0\\n\\nPowered by RIA Engine v2.1\\n\\n🧠 Enhanced Historical Data System\\n📊 365+ Day Market Analysis\\n🚀 Multi-Chain DEX Trading\\n⚡ Progressive Data Loading\\n🔬 Scientific Market Analysis'
            });
          }
        },
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/Zoverions/ria-engine');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event listeners
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // On macOS it's common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// IPC handlers for renderer communication
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-stored-data', (event, key) => {
  return store.get(key);
});

ipcMain.handle('set-stored-data', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('delete-stored-data', (event, key) => {
  store.delete(key);
  return true;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

ipcMain.handle('run-trading-engine', async (event, config) => {
  try {
    // Run the trading engine as a subprocess
    const enginePath = path.join(__dirname, '..', 'ria-engine-v2', 'demos', 'erc20-bot-demo.js');
    const child = spawn('node', [enginePath], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, ...config }
    });
    
    return { success: true, pid: child.pid };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('run-backtest', async (event, config) => {
  try {
    const backtestPath = path.join(__dirname, '..', 'ria-engine-v2', 'demos', 'eth-backtest.js');
    const child = spawn('node', [backtestPath], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, ...config }
    });

    return new Promise((resolve) => {
      let output = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      child.on('close', (code) => {
        resolve({
          success: code === 0,
          output: output,
          exitCode: code
        });
      });
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Check if running in development
isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';

console.log('RIA Trading Desktop starting...');
console.log('Development mode:', isDev);