const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Data storage
  getStoredData: (key) => ipcRenderer.invoke('get-stored-data', key),
  setStoredData: (key, value) => ipcRenderer.invoke('set-stored-data', key, value),
  deleteStoredData: (key) => ipcRenderer.invoke('delete-stored-data', key),
  
  // Dialogs
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // Trading engine
  runTradingEngine: (config) => ipcRenderer.invoke('run-trading-engine', config),
  runBacktest: (config) => ipcRenderer.invoke('run-backtest', config),
  
  // Menu actions
  onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window')
});

// Log that preload script has loaded
console.log('Preload script loaded successfully');