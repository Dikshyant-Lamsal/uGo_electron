/* eslint-disable prettier/prettier */
// src/preload/index.js
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  dialog: {
    showMessage: (options) => ipcRenderer.invoke('show-message', options),
  },

  // Excel/Student API (now using PostgreSQL)
  excel: {
    // Students
    getStudents: (params) => ipcRenderer.invoke('excel:getStudents', params),
    getStudent: (id) => ipcRenderer.invoke('excel:getStudent', id),
    addStudent: (student) => ipcRenderer.invoke('excel:addStudent', student),
    updateStudent: (id, updates) => ipcRenderer.invoke('excel:updateStudent', { id, updates }),
    deleteStudent: (id) => ipcRenderer.invoke('excel:deleteStudent', id),
    getStats: () => ipcRenderer.invoke('excel:getStats'),
    refresh: () => ipcRenderer.invoke('excel:refresh'),

    // Import
    getPath: () => ipcRenderer.invoke('excel:getPath'),
    importFile: (data) => ipcRenderer.invoke('excel:importFile', data),

    // Cohort management
    getCohorts: () => ipcRenderer.invoke('excel:getCohorts'),
    addCohort: (cohortName) => ipcRenderer.invoke('excel:addCohort', cohortName),

    // Participations
    getParticipations: (studentId) => ipcRenderer.invoke('excel:getParticipations', studentId),
    addParticipation: (participation) => ipcRenderer.invoke('excel:addParticipation', participation),
    updateParticipation: (id, updates) => ipcRenderer.invoke('excel:updateParticipation', { id, updates }),
    deleteParticipation: (id) => ipcRenderer.invoke('excel:deleteParticipation', id),
    getAllParticipations: (params) => ipcRenderer.invoke('excel:getAllParticipations', params)
  },

  // Photo API (now using Cloudinary)
  photos: {
    savePhoto: (data) => ipcRenderer.invoke('photos:save', data),
    getPhotoPath: (id) => ipcRenderer.invoke('photos:getPath', id),
    photoExists: (id) => ipcRenderer.invoke('photos:exists', id),
    deletePhoto: (id) => ipcRenderer.invoke('photos:delete', id),
    // Migration helper (run once to move local photos to cloud)
    migrateToCloudinary: () => ipcRenderer.invoke('photos:migrateToCloudinary')
  },

  // PDF export
  pdf: {
    save: (htmlContent, defaultFileName) =>
      ipcRenderer.invoke('save-pdf', { htmlContent, defaultFileName })
  },

  // General IPC
  send: (channel, data) => {
    const validChannels = ['devtools-refresh'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI,
      ipcRenderer: {
        send: (channel, ...args) => {
          const validChannels = ['toggle-devtools', 'ping'];
          if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, ...args);
          }
        },
        invoke: electronAPI.ipcRenderer.invoke,
        on: electronAPI.ipcRenderer.on,
        once: electronAPI.ipcRenderer.once,
        removeListener: electronAPI.ipcRenderer.removeListener
      }
    })
    contextBridge.exposeInMainWorld('api', api)
    console.log('✅ Preload: Context bridge established')
  } catch (error) {
    console.error('❌ Preload error:', error)
  }
} else {
  window.electron = {
    ...electronAPI,
    ipcRenderer: {
      send: ipcRenderer.send,
      invoke: ipcRenderer.invoke,
      on: ipcRenderer.on,
      once: ipcRenderer.once,
      removeListener: ipcRenderer.removeListener
    }
  }
  window.api = api
}