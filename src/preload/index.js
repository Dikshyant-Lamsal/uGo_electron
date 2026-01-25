/* eslint-disable prettier/prettier */
// src/preload/index.js
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Excel/Student API
  excel: {
    // Get all students with filters
    getStudents: (params) => ipcRenderer.invoke('excel:getStudents', params),

    // Get single student by ID
    getStudent: (id) => ipcRenderer.invoke('excel:getStudent', id),

    // Add new student
    addStudent: (student) => ipcRenderer.invoke('excel:addStudent', student),

    // Update student
    updateStudent: (id, updates) => ipcRenderer.invoke('excel:updateStudent', { id, updates }),

    // Delete student
    deleteStudent: (id) => ipcRenderer.invoke('excel:deleteStudent', id),

    // Get dashboard statistics
    getStats: () => ipcRenderer.invoke('excel:getStats'),

    // Get all sheet names
    getSheets: () => ipcRenderer.invoke('excel:getSheets'),

    // Get data from specific sheet
    getSheetData: (params) => ipcRenderer.invoke('excel:getSheetData', params),

    // Refresh data from Excel
    refresh: () => ipcRenderer.invoke('excel:refresh'),

    // Import Excel file
    import: (filePath) => ipcRenderer.invoke('excel:import', filePath),

    // Import file with details
    importFile: (data) => ipcRenderer.invoke('excel:importFile', data),

    // ✅ Participation methods
    getParticipations: (studentId) => ipcRenderer.invoke('excel:getParticipations', studentId),
    getParticipation: (id) => ipcRenderer.invoke('excel:getParticipation', id),
    addParticipation: (participation) => ipcRenderer.invoke('excel:addParticipation', participation),
    updateParticipation: (id, updates) => ipcRenderer.invoke('excel:updateParticipation', { id, updates }),
    deleteParticipation: (id) => ipcRenderer.invoke('excel:deleteParticipation', id),
    getAllParticipations: (params) => ipcRenderer.invoke('excel:getAllParticipations', params)
  },

  // Photo API
  photos: {
    // Save photo
    savePhoto: (data) => ipcRenderer.invoke('photos:save', data),  // ← ADD THIS

    // Get photo path for student
    getPhotoPath: (id) => ipcRenderer.invoke('photos:getPath', id),

    // Check if photo exists
    photoExists: (id) => ipcRenderer.invoke('photos:exists', id),

    // Delete photo
    deletePhoto: (id) => ipcRenderer.invoke('photos:delete', id)  // ← ADD THIS
  },

  pdf: {
    save: (htmlContent, defaultFileName) => 
      ipcRenderer.invoke('save-pdf', { htmlContent, defaultFileName })
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}