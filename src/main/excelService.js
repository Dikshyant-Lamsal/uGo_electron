/* eslint-disable prettier/prettier */
import { ipcMain } from 'electron';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname replacement for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to Excel file
const excelPath = path.resolve(__dirname, '../../data/students.xlsx');

// --- Helpers ---

// Read all sheets
function getSheets() {
    const workbook = XLSX.readFile(excelPath);
    return workbook.SheetNames;
}

// Read data from a sheet
function getSheetData(sheetName) {
    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);
    return XLSX.utils.sheet_to_json(sheet);
}

// Get all students from Master_Database sheet
function getAllStudents() {
    return getSheetData('Master_Database'); // ✅ use Master_Database explicitly
}

// Apply search, pagination, and optional filters
function filterStudents(students, { page = 1, limit = 100, search = '', filters = {} } = {}) {
    let filtered = [...students];

    // Search across multiple fields
    if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(student => {
            const name = (student.Full_Name || '').toLowerCase();
            const college = (student.College || '').toLowerCase();
            const program = (student.Program || '').toLowerCase();
            const district = (student.District || '').toLowerCase();
            return name.includes(s) || college.includes(s) || program.includes(s) || district.includes(s);
        });
    }

    // Apply additional filters
    for (const key in filters) {
        if (!filters[key] || filters[key] === 'All') continue;
        filtered = filtered.filter(student => (student[key] || '') === filters[key]);
    }

    // Pagination
    const total = filtered.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    return {
        data: paginated,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
}

// --- IPC Handlers ---

// Get students for frontend
ipcMain.handle('excel:getStudents', (event, params) => {
    try {
        const students = getAllStudents(); // Always from Master_Database
        const result = filterStudents(students, params);
        return { success: true, ...result };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Get sheet names
ipcMain.handle('excel:getSheets', () => {
    try {
        const sheets = getSheets();
        return { success: true, sheets };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Get data from any sheet with optional pagination/search
ipcMain.handle('excel:getSheetData', (event, { sheetName, page, limit, search }) => {
    try {
        const data = getSheetData(sheetName);
        const result = filterStudents(data, { page, limit, search });
        return { success: true, ...result };
    } catch (err) {
        return { success: false, error: err.message };
    }
});
