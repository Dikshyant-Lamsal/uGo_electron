/* eslint-disable prettier/prettier */
import { app, shell, BrowserWindow, ipcMain, protocol, net } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { existsSync } from 'fs';
import { dialog } from 'electron';

// Import Excel backend service
import './excelService.js'; // ✅ Just import once; it registers IPC handlers


// Register custom protocol BEFORE app.whenReady()
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'atom',
    privileges: {
      secure: true,
      supportFetchAPI: true,
      standard: true,
      bypassCSP: true,
      corsEnabled: true
    }
  }
]);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Load dev URL or production HTML
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  // Register custom protocol handler using modern API
  protocol.handle('atom', (request) => {
    let url = request.url;
    
    console.log('🔍 Protocol handler - Incoming request:', url);
    
    try {
      // Remove the atom:// protocol
      url = url.replace('atom://', '');
      
      // Decode URI components
      url = decodeURIComponent(url);
      
      console.log('🔍 After decode:', url);
      
      // Handle Windows paths
      if (process.platform === 'win32') {
        // Fix lowercase drive letter without colon (c/Users -> C:\Users)
        url = url.replace(/^([a-z])(\/|\\)/i, (match, driveLetter) => {
          return driveLetter.toUpperCase() + ':\\';
        });
        
        // Remove leading slash if present (e.g., /C:/ -> C:/)
        if (url.match(/^\/[A-Za-z]:\//)) {
          url = url.substring(1);
        }
        
        // Normalize slashes to backslashes
        url = url.replace(/\//g, '\\');
      }
      
      console.log('🔍 Final resolved path:', url);
      
      // Check if file exists
      if (!existsSync(url)) {
        console.error('❌ File does not exist:', url);
        return new Response('File not found', { 
          status: 404,
          headers: { 'content-type': 'text/plain' }
        });
      }
      
      console.log('✅ File exists, serving:', url);
      
      // Use net.fetch to load the file
      return net.fetch(`file://${url}`);
      
    } catch (error) {
      console.error('❌ Protocol error:', error);
      return new Response('Internal error', { 
        status: 500,
        headers: { 'content-type': 'text/plain' }
      });
    }
  });

  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Test IPC
ipcMain.on('ping', () => console.log('pong'));