/* eslint-disable prettier/prettier */
// PDF Service - Simple PDF generation and saving
import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import fs from 'fs';

// ============================================
// HELPER FUNCTIONS
// ============================================

function restoreFocus() {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
        const mainWindow = windows[0];
        setTimeout(() => {
            mainWindow.focus();
            mainWindow.webContents.focus();
        }, 50);
    }
}

// ============================================
// IPC HANDLER - PDF SAVE
// ============================================

ipcMain.handle('save-pdf', async (event, { htmlContent, defaultFileName, openAfterSave = true }) => {
    try {
        const { filePath, canceled } = await dialog.showSaveDialog({
            title: 'Save PDF',
            defaultPath: defaultFileName || 'student-profile.pdf',
            filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
        });

        if (canceled || !filePath) {
            restoreFocus();
            return { success: false, canceled: true };
        }

        const pdfWindow = new BrowserWindow({
            show: false,
            webPreferences: {
                nodeIntegration: false,
                sandbox: true
            }
        });

        await pdfWindow.loadURL(
            `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`
        );

        await new Promise(resolve => setTimeout(resolve, 800));

        const pdfData = await pdfWindow.webContents.printToPDF({
            printBackground: true,
            pageSize: 'A4',
            margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 }
        });

        fs.writeFileSync(filePath, pdfData);
        pdfWindow.destroy();

        if (openAfterSave) {
            await shell.openPath(filePath);
        }

        restoreFocus();
        return { success: true, filePath };
    } catch (error) {
        console.error('Error saving PDF:', error);
        restoreFocus();
        return { success: false, error: error.message };
    }
});

console.log('✅ PDF Service initialized');