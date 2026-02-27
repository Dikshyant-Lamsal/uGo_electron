/* eslint-disable prettier/prettier */
// src/preload/__tests__/index.test.js
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockIpcRenderer = {
    invoke: vi.fn(),
    send: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
}

const mockElectronAPI = {
    ipcRenderer: {
        invoke: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        removeListener: vi.fn(),
    },
}

const mockContextBridge = {
    exposeInMainWorld: vi.fn(),
}

vi.mock('electron', () => ({
    contextBridge: mockContextBridge,
    ipcRenderer: mockIpcRenderer,
}))

vi.mock('@electron-toolkit/preload', () => ({
    electronAPI: mockElectronAPI,
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Re-import the preload module freshly after each test */
const loadPreload = () => import('../index')

/** Extract the `api` object captured by contextBridge.exposeInMainWorld('api', ...) */
const getCapturedApi = () => {
    const call = mockContextBridge.exposeInMainWorld.mock.calls.find(([key]) => key === 'api')
    return call?.[1]
}

/** Extract the `electron` object captured by contextBridge */
const getCapturedElectron = () => {
    const call = mockContextBridge.exposeInMainWorld.mock.calls.find(([key]) => key === 'electron')
    return call?.[1]
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Preload – contextIsolated = true', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        Object.defineProperty(process, 'contextIsolated', { value: true, configurable: true })
    })

    // ── Context bridge setup ─────────────────────────────────────────────────

    describe('contextBridge setup', () => {
        it('exposes "electron" and "api" worlds', async () => {
            await loadPreload()
            const keys = mockContextBridge.exposeInMainWorld.mock.calls.map(([k]) => k)
            expect(keys).toContain('electron')
            expect(keys).toContain('api')
        })

        it('spreads electronAPI into the electron world', async () => {
            await loadPreload()
            const electron = getCapturedElectron()
            expect(electron).toMatchObject(mockElectronAPI)
        })

        it('overrides ipcRenderer.send with a channel allowlist', async () => {
            await loadPreload()
            const { ipcRenderer } = getCapturedElectron()

            ipcRenderer.send('toggle-devtools', 'arg1')
            expect(mockIpcRenderer.send).toHaveBeenCalledWith('toggle-devtools', 'arg1')

            mockIpcRenderer.send.mockClear()
            ipcRenderer.send('evil-channel')
            expect(mockIpcRenderer.send).not.toHaveBeenCalled()
        })

        it('delegates invoke / on / once / removeListener to electronAPI.ipcRenderer', async () => {
            await loadPreload()
            const { ipcRenderer } = getCapturedElectron()

            expect(ipcRenderer.invoke).toBe(mockElectronAPI.ipcRenderer.invoke)
            expect(ipcRenderer.on).toBe(mockElectronAPI.ipcRenderer.on)
            expect(ipcRenderer.once).toBe(mockElectronAPI.ipcRenderer.once)
            expect(ipcRenderer.removeListener).toBe(mockElectronAPI.ipcRenderer.removeListener)
        })
    })

    // ── dialog ───────────────────────────────────────────────────────────────

    describe('api.dialog', () => {
        it('showMessage invokes show-message with options', async () => {
            await loadPreload()
            const { dialog } = getCapturedApi()
            const opts = { message: 'Hello' }
            dialog.showMessage(opts)
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('show-message', opts)
        })
    })

    // ── excel ────────────────────────────────────────────────────────────────

    describe('api.excel', () => {
        const cases = [
            ['getStudents', 'excel:getStudents', [{ page: 1 }]],
            ['getStudent', 'excel:getStudent', [42]],
            ['addStudent', 'excel:addStudent', [{ name: 'Alice' }]],
            ['updateStudent', 'excel:updateStudent', [1, { name: 'Bob' }]],
            ['deleteStudent', 'excel:deleteStudent', [99]],
            ['getStats', 'excel:getStats', []],
            ['refresh', 'excel:refresh', []],
            ['getPath', 'excel:getPath', []],
            ['importFile', 'excel:importFile', [{ rows: [] }]],
            ['exportFile', 'excel:exportFile', []],
            ['backupToSupabase', 'excel:backupToSupabase', []],
            ['getCohorts', 'excel:getCohorts', []],
            ['addCohort', 'excel:addCohort', ['Cohort A']],
            ['getParticipations', 'excel:getParticipations', [5]],
            ['addParticipation', 'excel:addParticipation', [{ event: 'X' }]],
            ['deleteParticipation', 'excel:deleteParticipation', [7]],
            ['getAllParticipations', 'excel:getAllParticipations', [{ filter: 'all' }]],
        ]

        it.each(cases)('%s → invokes %s', async (method, channel, args) => {
            await loadPreload()
            const { excel } = getCapturedApi()
            excel[method](...args)

            if (args.length > 0) {
                expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(channel, expect.anything())
            } else {
                expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(channel)
            }
        })

        it('updateStudent wraps id + updates into an object', async () => {
            await loadPreload()
            const { excel } = getCapturedApi()
            excel.updateStudent(3, { name: 'Carol' })
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('excel:updateStudent', {
                id: 3,
                updates: { name: 'Carol' },
            })
        })

        it('updateParticipation wraps id + updates into an object', async () => {
            await loadPreload()
            const { excel } = getCapturedApi()
            excel.updateParticipation(8, { score: 100 })
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('excel:updateParticipation', {
                id: 8,
                updates: { score: 100 },
            })
        })
    })

    // ── photos ───────────────────────────────────────────────────────────────

    // Replace the photos describe block with this:
    describe('api.photos', () => {
        const cases = [
            ['savePhoto', 'photos:save', [{ blob: '...' }]],
            ['getPhotoPath', 'photos:getPath', ['student-1']],
            ['photoExists', 'photos:exists', ['student-1']],
            ['deletePhoto', 'photos:delete', ['student-1']],
            ['migrateToCloudinary', 'photos:migrateToCloudinary', []],
        ]

        it.each(cases)('%s → invokes %s', async (method, channel, args) => {
            await loadPreload()
            const { photos } = getCapturedApi()   // ← was destructuring `excel` before
            photos[method](...args)

            if (args.length > 0) {
                expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(channel, expect.anything())
            } else {
                expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(channel)
            }
        })
    })

    // ── pdf ──────────────────────────────────────────────────────────────────

    describe('api.pdf', () => {
        it('save invokes save-pdf with htmlContent and defaultFileName', async () => {
            await loadPreload()
            const { pdf } = getCapturedApi()
            pdf.save('<html/>', 'report.pdf')
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('save-pdf', {
                htmlContent: '<html/>',
                defaultFileName: 'report.pdf',
            })
        })
    })

    // ── api.send ─────────────────────────────────────────────────────────────

    describe('api.send', () => {
        it('sends on valid channel "devtools-refresh"', async () => {
            await loadPreload()
            const { send } = getCapturedApi()
            send('devtools-refresh', { foo: 1 })
            expect(mockIpcRenderer.send).toHaveBeenCalledWith('devtools-refresh', { foo: 1 })
        })

        it('blocks unlisted channels', async () => {
            await loadPreload()
            const { send } = getCapturedApi()
            send('__proto__-injection')
            expect(mockIpcRenderer.send).not.toHaveBeenCalled()
        })
    })

    // ── error path ───────────────────────────────────────────────────────────

    describe('error handling', () => {
        it('logs error when contextBridge.exposeInMainWorld throws', async () => {
            mockContextBridge.exposeInMainWorld.mockImplementationOnce(() => {
                throw new Error('bridge failure')
            })
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
            await loadPreload()
            expect(consoleSpy).toHaveBeenCalledWith('❌ Preload error:', expect.any(Error))
            consoleSpy.mockRestore()
        })
    })
})

// ── contextIsolated = false ──────────────────────────────────────────────────

describe('Preload – contextIsolated = false', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        Object.defineProperty(process, 'contextIsolated', { value: false, configurable: true })
        global.window = {}
    })

    afterEach(() => {
        delete global.window
    })

    it('assigns window.electron with raw ipcRenderer methods', async () => {
        await loadPreload()
        expect(window.electron).toBeDefined()
        expect(window.electron.ipcRenderer.send).toBe(mockIpcRenderer.send)
        expect(window.electron.ipcRenderer.invoke).toBe(mockIpcRenderer.invoke)
    })

    it('assigns window.api', async () => {
        await loadPreload()
        expect(window.api).toBeDefined()
        expect(typeof window.api.excel.getStudents).toBe('function')
    })

    it('does NOT call contextBridge when not isolated', async () => {
        await loadPreload()
        expect(mockContextBridge.exposeInMainWorld).not.toHaveBeenCalled()
    })
})