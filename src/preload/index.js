/* eslint-disable prettier/prettier */
// src/preload/index.js
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Excel/Student API
  excel: {
    getStudents: (params) => ipcRenderer.invoke('excel:getStudents', params),
    getStudent: (id) => ipcRenderer.invoke('excel:getStudent', id),
    addStudent: (student) => ipcRenderer.invoke('excel:addStudent', student),
    updateStudent: (id, updates) => ipcRenderer.invoke('excel:updateStudent', { id, updates }),
    deleteStudent: (id) => ipcRenderer.invoke('excel:deleteStudent', id),
    getStats: () => ipcRenderer.invoke('excel:getStats'),
    getSheets: () => ipcRenderer.invoke('excel:getSheets'),
    getSheetData: (params) => ipcRenderer.invoke('excel:getSheetData', params),
    refresh: () => ipcRenderer.invoke('excel:refresh'),
    getPath: () => ipcRenderer.invoke('excel:getPath'),
    import: (filePath) => ipcRenderer.invoke('excel:import', filePath),
    importFile: (data) => ipcRenderer.invoke('excel:importFile', data),

    // Participation methods
    getParticipations: (studentId) => ipcRenderer.invoke('excel:getParticipations', studentId),
    getParticipation: (id) => ipcRenderer.invoke('excel:getParticipation', id),
    addParticipation: (participation) => ipcRenderer.invoke('excel:addParticipation', participation),
    updateParticipation: (id, updates) => ipcRenderer.invoke('excel:updateParticipation', { id, updates }),
    deleteParticipation: (id) => ipcRenderer.invoke('excel:deleteParticipation', id),
    getAllParticipations: (params) => ipcRenderer.invoke('excel:getAllParticipations', params)
  },

  // Photo API
  photos: {
    savePhoto: (data) => ipcRenderer.invoke('photos:save', data),
    getPhotoPath: (id) => ipcRenderer.invoke('photos:getPath', id),
    photoExists: (id) => ipcRenderer.invoke('photos:exists', id),
    deletePhoto: (id) => ipcRenderer.invoke('photos:delete', id)
  },

  pdf: {
    save: (htmlContent, defaultFileName) =>
      ipcRenderer.invoke('save-pdf', { htmlContent, defaultFileName })
  },

  send: (channel, data) => {
    const validChannels = ['devtools-refresh']; // whitelist channels
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  }
}

// ✅ ONLY EXPOSE ONCE
if(process.contextIsolated) {
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