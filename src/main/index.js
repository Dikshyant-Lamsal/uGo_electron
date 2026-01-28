/* eslint-disable prettier/prettier */
import { app, shell, BrowserWindow, ipcMain, protocol, net, dialog } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

// ============================================
// LOAD ENVIRONMENT VARIABLES
// ============================================
dotenv.config();

// ============================================
// IMPORT SERVICES
// ============================================

// NEW: PostgreSQL Database Service (replaces Google Sheets)
import './services/databaseService.js';

// NEW: Cloudinary Photos Service (replaces local photo storage)
import './services/photosService.js';

// PDF Export Service
import './services/pdfService.js';

// OLD: Google Sheets Service (commented out - keep as backup)
// import './googleSheetService.js';

// ============================================
// WINDOW MANAGEMENT
// ============================================

let mainWindow = null;

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
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Handle focus events
  mainWindow.on('focus', () => {
    console.log('✅ Window focused');
  });

  mainWindow.on('blur', () => {
    console.log('⚠️ Window blurred');
  });

  // Auto-restore focus after losing it
  mainWindow.on('restore', () => {
    mainWindow.focus();
  });

  // Load dev URL or production HTML
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Clear reference on close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================
// APP LIFECYCLE
// ============================================

app.whenReady().then(() => {
  // Register custom protocol handler using modern API
  protocol.handle('atom', (request) => {
    let url = request.url;

    console.log('🔍 Protocol handler - Incoming request:', url);

    try {
      url = url.replace('atom://', '');
      url = decodeURIComponent(url);

      console.log('🔍 After decode:', url);

      if (process.platform === 'win32') {
        url = url.replace(/^([a-z])(\/|\\)/i, (match, driveLetter) => {
          return driveLetter.toUpperCase() + ':\\';
        });

        if (url.match(/^\/[A-Za-z]:\//)) {
          url = url.substring(1);
        }

        url = url.replace(/\//g, '\\');
      }

      console.log('🔍 Final resolved path:', url);

      if (!existsSync(url)) {
        console.error('❌ File does not exist:', url);
        return new Response('File not found', {
          status: 404,
          headers: { 'content-type': 'text/plain' }
        });
      }

      console.log('✅ File exists, serving:', url);

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

    // Auto-restore focus when window becomes visible
    window.on('show', () => {
      setTimeout(() => window.focus(), 100);
    });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.focus();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================
// IPC HANDLERS
// ============================================

/**
 * Helper function to restore focus
 */
function restoreFocus() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    mainWindow.webContents.focus();
  }
}

/**
 * Toggle DevTools
 */
ipcMain.on('toggle-devtools', () => {
  console.log('🔧 Simulating Ctrl+Shift+I twice');

  const targetWindow = BrowserWindow.getFocusedWindow() || mainWindow || BrowserWindow.getAllWindows()[0];

  if (!targetWindow) {
    console.error('❌ No window available');
    return;
  }

  // Function to simulate Ctrl+Shift+I
  const pressCtrlShiftI = () => {
    // Key down events
    targetWindow.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Control' });
    targetWindow.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Shift' });
    targetWindow.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'I' });

    // Key up events
    targetWindow.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'I' });
    targetWindow.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Shift' });
    targetWindow.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Control' });
  };

  // Press Ctrl+Shift+I first time
  pressCtrlShiftI();
  console.log('✅ First Ctrl+Shift+I sent');

  // Wait and press again
  setTimeout(() => {
    pressCtrlShiftI();
    console.log('✅ Second Ctrl+Shift+I sent');

    // Restore focus
    setTimeout(() => {
      targetWindow.focus();
      targetWindow.webContents.focus();
      console.log('✅ Focus restored');
    }, 100);
  }, 200);
});

/**
 * Show message dialog
 */
ipcMain.handle('show-message', async (event, { type, title, message, buttons }) => {
  const targetWindow = BrowserWindow.getFocusedWindow() || mainWindow || BrowserWindow.getAllWindows()[0];

  if (!targetWindow) {
    return { response: 0 };
  }

  const result = await dialog.showMessageBox(targetWindow, {
    type: type || 'info',
    title: title || 'Message',
    message: message || '',
    buttons: buttons || ['OK'],
    defaultId: 0,
    cancelId: buttons ? buttons.length - 1 : 0
  });

  return result;
});

/**
 * Test IPC
 */
ipcMain.on('ping', () => console.log('pong'));

// ============================================
// STARTUP LOGGING
// ============================================

console.log('\n' + '='.repeat(60));
console.log('🚀 APPLICATION STARTUP');
console.log('='.repeat(60));
console.log(`📦 App Version: ${app.getVersion()}`);
console.log(`🖥️  Platform: ${process.platform}`);
console.log(`📁 App Path: ${app.getAppPath()}`);
console.log(`🔧 Node Version: ${process.versions.node}`);
console.log(`⚡ Electron Version: ${process.versions.electron}`);
console.log(`🌐 Chrome Version: ${process.versions.chrome}`);
console.log('');
console.log('🔌 Services Loaded:');
console.log('   ✅ Database Service (PostgreSQL)');
console.log('   ✅ Photos Service (Cloudinary)');
console.log('   ✅ PDF Service');
console.log('');
console.log('📊 Environment:');
console.log(`   Database: ${process.env.DATABASE_URL ? '✅ Connected' : '❌ Not configured'}`);
console.log(`   Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Connected' : '❌ Not configured'}`);
console.log('='.repeat(60) + '\n');