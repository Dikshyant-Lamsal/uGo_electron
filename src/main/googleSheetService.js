/* eslint-disable prettier/prettier */
// Google Sheets Service - Using Service Account (No OAuth needed!)
// Photos remain stored locally in /data/photos

import { ipcMain, BrowserWindow, dialog, shell } from 'electron';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// __dirname replacement for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURATION
// ============================================

// Path to service account credentials
const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, '../../config/service-account.json');

// Google Sheets ID
const SPREADSHEET_ID = '1PwfwsUsSBYY9FXhGLU8LGqAW8_-tKrmIeTGw3aal784';

// Sheet names
const MASTER_SHEET = 'Master_Database';
const PARTICIPATIONS_SHEET = 'Participations';

// Photo path (kept local)
const photosPath = path.resolve(__dirname, '../../data/photos');

// Ensure photos directory exists
if (!fs.existsSync(photosPath)) {
    fs.mkdirSync(photosPath, { recursive: true });
}

// Cache for performance
let cachedData = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30000; // 30 seconds

// ============================================
// GOOGLE AUTHENTICATION (SERVICE ACCOUNT)
// ============================================

let sheetsAPI = null;

/**
 * Initialize Google Sheets API with Service Account
 * No OAuth needed - just reads the service account JSON file
 */
async function initializeSheetsAPI() {
    if (sheetsAPI) return sheetsAPI;

    try {
        // Read service account credentials
        const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

        // Create JWT auth client (new format)
        const auth = new google.auth.JWT({
            email: serviceAccount.client_email,
            key: serviceAccount.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        // 🔥 CRITICAL: Authorize the client BEFORE making API calls
        await auth.authorize();
        console.log('✅ Service Account authorized');

        // Initialize Sheets API
        sheetsAPI = google.sheets({ version: 'v4', auth });

        console.log('✅ Google Sheets API initialized with Service Account');
        console.log(`📧 Service Account: ${serviceAccount.client_email}`);

        return sheetsAPI;
    } catch (err) {
        console.error('❌ Failed to initialize Google Sheets API:', err);
        throw new Error(`Service account authentication failed: ${err.message}`);
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if cache is valid
 */
function isCacheValid() {
    if (!cachedData || !cacheTimestamp) return false;
    return (Date.now() - cacheTimestamp) < CACHE_DURATION;
}

/**
 * Restore focus to main window
 */
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

/**
 * Convert row array to student object
 */
function rowToStudent(row, rowIndex) {
    if (!row || row.length === 0) return null;

    return {
        id: parseInt(row[0]) || rowIndex,
        Student_ID: row[1] || '',
        Full_Name: row[2] || '',
        District: row[3] || '',
        Address: row[4] || '',
        Contact_Number: row[5] || '',
        Father_Name: row[6] || '',
        Father_Contact: row[7] || '',
        Mother_Name: row[8] || '',
        Mother_Contact: row[9] || '',
        Program: row[10] || '',
        College: row[11] || '',
        Current_Year: row[12] || '',
        Program_Structure: row[13] || '',
        Scholarship_Type: row[14] || '',
        Scholarship_Percentage: row[15] || '',
        Scholarship_Starting_Year: row[16] || '',
        Scholarship_Status: row[17] || '',
        Total_College_Fee: row[18] || '',
        Total_Scholarship_Amount: row[19] || '',
        Total_Amount_Paid: row[20] || '',
        Total_Due: row[21] || '',
        Books_Total: row[22] || '',
        Uniform_Total: row[23] || '',
        Year_1_Payment: row[24] || '',
        Year_2_Payment: row[25] || '',
        Year_3_Payment: row[26] || '',
        Year_4_Payment: row[27] || '',
        Year_1_GPA: row[28] || '',
        Year_2_GPA: row[29] || '',
        Year_3_GPA: row[30] || '',
        Year_4_GPA: row[31] || '',
        Overall_Status: row[32] || '',
        Participation: row[33] || '',
        Remarks: row[34] || '',
        Source_Sheet: row[35] || '',
        Cohort: row[36] || '',
        Last_Updated: row[37] || ''
    };
}

/**
 * Convert student object to row array
 */
function studentToRow(student) {
    return [
        student.id || '',
        student.Student_ID || '',
        student.Full_Name || '',
        student.District || '',
        student.Address || '',
        student.Contact_Number || '',
        student.Father_Name || '',
        student.Father_Contact || '',
        student.Mother_Name || '',
        student.Mother_Contact || '',
        student.Program || '',
        student.College || '',
        student.Current_Year || '',
        student.Program_Structure || '',
        student.Scholarship_Type || '',
        student.Scholarship_Percentage || '',
        student.Scholarship_Starting_Year || '',
        student.Scholarship_Status || '',
        student.Total_College_Fee || '',
        student.Total_Scholarship_Amount || '',
        student.Total_Amount_Paid || '',
        student.Total_Due || '',
        student.Books_Total || '',
        student.Uniform_Total || '',
        student.Year_1_Payment || '',
        student.Year_2_Payment || '',
        student.Year_3_Payment || '',
        student.Year_4_Payment || '',
        student.Year_1_GPA || '',
        student.Year_2_GPA || '',
        student.Year_3_GPA || '',
        student.Year_4_GPA || '',
        student.Overall_Status || '',
        student.Participation || '',
        student.Remarks || '',
        student.Source_Sheet || '',
        student.Cohort || '',
        student.Last_Updated || new Date().toISOString()
    ];
}

/**
 * Convert row array to participation object
 */
function rowToParticipation(row, rowIndex) {
    if (!row || row.length === 0) return null;

    return {
        participation_id: parseInt(row[0]) || rowIndex,
        student_id: parseInt(row[1]) || 0,
        event_name: row[2] || '',
        event_date: row[3] || '',
        event_type: row[4] || 'Workshop',
        role: row[5] || 'Participant',
        hours: parseFloat(row[6]) || 0,
        notes: row[7] || '',
        created_at: row[8] || '',
        updated_at: row[9] || ''
    };
}

/**
 * Convert participation object to row array
 */
function participationToRow(participation) {
    return [
        participation.participation_id || '',
        participation.student_id || '',
        participation.event_name || '',
        participation.event_date || '',
        participation.event_type || 'Workshop',
        participation.role || 'Participant',
        participation.hours || 0,
        participation.notes || '',
        participation.created_at || new Date().toISOString(),
        participation.updated_at || new Date().toISOString()
    ];
}

// ============================================
// GOOGLE SHEETS CRUD OPERATIONS
// ============================================

/**
 * Get all students from Google Sheets
 */
async function getAllStudents(forceRefresh = false) {
    try {
        // Return cached data if valid
        if (!forceRefresh && isCacheValid()) {
            console.log('📦 Using cached data');
            return cachedData;
        }

        console.log('📖 Reading from Google Sheets...');

        const sheets = await initializeSheetsAPI();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${MASTER_SHEET}!A2:AL`, // Skip header row
        });

        const rows = response.data.values || [];
        const students = rows
            .map((row, index) => rowToStudent(row, index + 2))
            .filter(s => s !== null);

        // Update cache
        cachedData = students;
        cacheTimestamp = Date.now();

        console.log(`✅ Loaded ${students.length} students from Google Sheets`);
        return students;
    } catch (err) {
        console.error('Error getting students from Google Sheets:', err);
        throw err;
    }
}

/**
 * Save all students to Google Sheets
 */
async function saveStudents(students) {
    try {
        console.log('💾 Saving to Google Sheets...');

        const sheets = await initializeSheetsAPI();

        // Convert students to rows
        const rows = students.map(s => studentToRow(s));

        // Clear existing data (except header)
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${MASTER_SHEET}!A2:AL`,
        });

        // Write new data
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${MASTER_SHEET}!A2`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: rows }
        });

        // Update cache
        cachedData = students;
        cacheTimestamp = Date.now();

        console.log('✅ Saved successfully to Google Sheets');
    } catch (err) {
        console.error('Error saving to Google Sheets:', err);
        throw err;
    }
}

/**
 * Get all participations from Google Sheets
 */
async function getAllParticipations() {
    try {
        const sheets = await initializeSheetsAPI();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${PARTICIPATIONS_SHEET}!A2:J`, // Skip header
        });

        const rows = response.data.values || [];
        const participations = rows
            .map((row, index) => rowToParticipation(row, index + 2))
            .filter(p => p !== null);

        return participations;
    } catch (err) {
        console.error('Error getting participations:', err);
        throw err;
    }
}

/**
 * Save all participations to Google Sheets
 */
async function saveParticipations(participations) {
    try {
        const sheets = await initializeSheetsAPI();

        const rows = participations.map(p => participationToRow(p));

        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${PARTICIPATIONS_SHEET}!A2:J`,
        });

        if (rows.length > 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${PARTICIPATIONS_SHEET}!A2`,
                valueInputOption: 'USER_ENTERED',
                resource: { values: rows }
            });
        }

        console.log('✅ Saved participations to Google Sheets');
    } catch (err) {
        console.error('Error saving participations:', err);
        throw err;
    }
}

/**
 * Apply search, pagination, and filters
 */
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

/**
 * Calculate statistics
 */
function calculateStats(students) {
    const stats = {
        totalStudents: students.length,
        byDistrict: {},
        byCollege: {},
        byProgram: {},
        byYear: {},
        bySource: {},
        byCohort: {},
        financialSummary: {
            totalFees: 0,
            totalScholarship: 0,
            totalPaid: 0,
            totalDue: 0
        }
    };

    students.forEach(student => {
        if (student.District) {
            stats.byDistrict[student.District] = (stats.byDistrict[student.District] || 0) + 1;
        }
        if (student.College) {
            stats.byCollege[student.College] = (stats.byCollege[student.College] || 0) + 1;
        }
        if (student.Program) {
            stats.byProgram[student.Program] = (stats.byProgram[student.Program] || 0) + 1;
        }
        if (student.Current_Year) {
            stats.byYear[student.Current_Year] = (stats.byYear[student.Current_Year] || 0) + 1;
        }
        if (student.Source_Sheet) {
            stats.bySource[student.Source_Sheet] = (stats.bySource[student.Source_Sheet] || 0) + 1;
        }
        if (student.Cohort) {
            stats.byCohort[student.Cohort] = (stats.byCohort[student.Cohort] || 0) + 1;
        }

        stats.financialSummary.totalFees += parseFloat(student.Total_College_Fee || 0);
        stats.financialSummary.totalScholarship += parseFloat(student.Total_Scholarship_Amount || 0);
        stats.financialSummary.totalPaid += parseFloat(student.Total_Amount_Paid || 0);
        stats.financialSummary.totalDue += parseFloat(student.Total_Due || 0);
    });

    return stats;
}

// ============================================
// IPC HANDLERS - STUDENTS
// ============================================

/**
 * Get all students with filters
 */
ipcMain.handle('excel:getStudents', async (event, params) => {
    try {
        const students = await getAllStudents();
        const result = filterStudents(students, params);
        return { success: true, ...result };
    } catch (err) {
        console.error('Error getting students:', err);
        return { success: false, error: err.message };
    }
});

/**
 * Get single student by ID
 */
ipcMain.handle('excel:getStudent', async (event, id) => {
    try {
        const students = await getAllStudents();
        const student = students.find(s => s.id === id);

        if (!student) {
            return { success: false, error: `Student with ID ${id} not found` };
        }

        return { success: true, data: student };
    } catch (err) {
        console.error('Error getting student:', err);
        return { success: false, error: err.message };
    }
});

/**
 * Add new student
 */
ipcMain.handle('excel:addStudent', async (event, studentData) => {
    try {
        const students = await getAllStudents();

        // Generate new ID
        const maxId = students.reduce((max, s) => Math.max(max, s.id || 0), 0);
        const newId = maxId + 1;

        const cohort = studentData.Source_Sheet || 'C1';

        const newStudent = {
            id: newId,
            Student_ID: `UGO_${cohort}_${newId}`,
            ...studentData,
            Last_Updated: new Date().toISOString()
        };

        students.push(newStudent);
        await saveStudents(students);

        console.log(`✅ Added student: ${newStudent.Full_Name} (ID: ${newStudent.Student_ID})`);

        return {
            success: true,
            data: newStudent,
            message: `Student "${newStudent.Full_Name}" added successfully`
        };
    } catch (err) {
        console.error('Error adding student:', err);
        return { success: false, error: err.message };
    }
});

/**
 * Update existing student
 */
ipcMain.handle('excel:updateStudent', async (event, { id, updates }) => {
    try {
        const students = await getAllStudents();
        const index = students.findIndex(s => s.id === id);

        if (index === -1) {
            return { success: false, error: `Student with ID ${id} not found` };
        }

        students[index] = {
            ...students[index],
            ...updates,
            id: students[index].id,
            Last_Updated: new Date().toISOString()
        };

        await saveStudents(students);

        console.log(`✅ Updated student: ${students[index].Full_Name} (ID: ${id})`);

        return {
            success: true,
            data: students[index],
            message: `Student "${students[index].Full_Name}" updated successfully`
        };
    } catch (err) {
        console.error('Error updating student:', err);
        return { success: false, error: err.message };
    }
});

/**
 * Delete student
 */
ipcMain.handle('excel:deleteStudent', async (event, id) => {
    try {
        const students = await getAllStudents();
        const index = students.findIndex(s => s.id === id);

        if (index === -1) {
            return { success: false, error: `Student with ID ${id} not found` };
        }

        const deletedStudent = students[index];
        students.splice(index, 1);

        await saveStudents(students);

        console.log(`✅ Deleted student: ${deletedStudent.Full_Name} (ID: ${id})`);

        return {
            success: true,
            message: `Student "${deletedStudent.Full_Name}" deleted successfully`
        };
    } catch (err) {
        console.error('Error deleting student:', err);
        return { success: false, error: err.message };
    }
});

/**
 * Get dashboard statistics
 */
ipcMain.handle('excel:getStats', async () => {
    try {
        const students = await getAllStudents();
        const stats = calculateStats(students);

        return {
            success: true,
            stats,
            fileInfo: {
                lastModified: new Date().toISOString(),
                totalStudents: students.length,
                source: 'Google Sheets'
            }
        };
    } catch (err) {
        console.error('Error getting stats:', err);
        return { success: false, error: err.message };
    }
});

/**
 * Refresh data from Google Sheets
 */
ipcMain.handle('excel:refresh', async () => {
    try {
        const students = await getAllStudents(true); // Force refresh

        return {
            success: true,
            message: 'Data refreshed successfully from Google Sheets',
            stats: { totalStudents: students.length }
        };
    } catch (err) {
        console.error('Error refreshing data:', err);
        return { success: false, error: err.message };
    }
});

// ============================================
// IPC HANDLERS - PARTICIPATIONS
// ============================================

/**
 * Get all participations for a student
 */
ipcMain.handle('excel:getParticipations', async (event, studentId) => {
    try {
        const participations = await getAllParticipations();
        const studentParticipations = participations.filter(p => p.student_id === studentId);

        studentParticipations.sort((a, b) =>
            new Date(b.event_date) - new Date(a.event_date)
        );

        console.log(`📋 Found ${studentParticipations.length} participations for student ${studentId}`);

        return { success: true, data: studentParticipations };
    } catch (err) {
        console.error('Error getting participations:', err);
        return { success: false, error: err.message, data: [] };
    }
});

/**
 * Add new participation
 */
ipcMain.handle('excel:addParticipation', async (event, participationData) => {
    try {
        console.log('📝 Adding participation:', participationData);

        const participations = await getAllParticipations();

        const maxId = participations.reduce((max, p) => Math.max(max, p.participation_id || 0), 0);
        const newId = maxId + 1;

        const newParticipation = {
            participation_id: newId,
            student_id: participationData.student_id,
            event_name: participationData.event_name || '',
            event_date: participationData.event_date || '',
            event_type: participationData.event_type || 'Workshop',
            role: participationData.role || 'Participant',
            hours: participationData.hours || 0,
            notes: participationData.notes || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        participations.push(newParticipation);
        await saveParticipations(participations);

        console.log(`✅ Added participation ID ${newId} for student ${participationData.student_id}`);

        return {
            success: true,
            data: newParticipation,
            message: 'Participation added successfully'
        };
    } catch (err) {
        console.error('Error adding participation:', err);
        return { success: false, error: err.message };
    }
});

/**
 * Update participation
 */
ipcMain.handle('excel:updateParticipation', async (event, { id, updates }) => {
    try {
        const participations = await getAllParticipations();
        const index = participations.findIndex(p => p.participation_id === id);

        if (index === -1) {
            return { success: false, error: `Participation with ID ${id} not found` };
        }

        participations[index] = {
            ...participations[index],
            ...updates,
            participation_id: participations[index].participation_id,
            student_id: participations[index].student_id,
            updated_at: new Date().toISOString()
        };

        await saveParticipations(participations);

        console.log(`✅ Updated participation ID ${id}`);

        return {
            success: true,
            data: participations[index],
            message: 'Participation updated successfully'
        };
    } catch (err) {
        console.error('Error updating participation:', err);
        return { success: false, error: err.message };
    }
});

/**
 * Delete participation
 */
ipcMain.handle('excel:deleteParticipation', async (event, id) => {
    try {
        const participations = await getAllParticipations();
        const index = participations.findIndex(p => p.participation_id === id);

        if (index === -1) {
            return { success: false, error: `Participation with ID ${id} not found` };
        }

        const deletedParticipation = participations[index];
        participations.splice(index, 1);

        await saveParticipations(participations);

        console.log(`✅ Deleted participation ID ${id}`);

        return {
            success: true,
            message: `Participation "${deletedParticipation.event_name}" deleted successfully`
        };
    } catch (err) {
        console.error('Error deleting participation:', err);
        return { success: false, error: err.message };
    }
});

// ============================================
// IPC HANDLERS - PHOTOS (LOCAL STORAGE)
// ============================================

/**
 * Save student photo (local file system)
 */
ipcMain.handle('photos:save', async (event, { id, photoData, extension }) => {
    try {
        const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        for (const ext of extensions) {
            const oldPhotoPath = path.join(photosPath, `${id}.${ext}`);
            if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath);
            }
        }

        const buffer = Buffer.from(photoData, 'base64');
        const photoPath = path.join(photosPath, `${id}.${extension}`);
        fs.writeFileSync(photoPath, buffer);

        console.log(`✅ Saved photo for student ID ${id}`);
        restoreFocus();

        return {
            success: true,
            message: 'Photo saved successfully',
            path: `atom://${photoPath}`
        };
    } catch (err) {
        console.error('Error saving photo:', err);
        restoreFocus();
        return { success: false, error: err.message };
    }
});

/**
 * Get photo path
 */
ipcMain.handle('photos:getPath', async (event, id) => {
    try {
        const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        for (const ext of extensions) {
            const photoPath = path.join(photosPath, `${id}.${ext}`);

            if (fs.existsSync(photoPath)) {
                const normalizedPath = path.resolve(photoPath);
                return {
                    success: true,
                    path: `atom://${normalizedPath}`
                };
            }
        }

        return { success: false, path: null };
    } catch (err) {
        console.error('Error getting photo path:', err);
        return { success: false, error: err.message, path: null };
    }
});

/**
 * Delete student photo
 */
ipcMain.handle('photos:delete', async (event, id) => {
    try {
        const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        let deleted = false;

        for (const ext of extensions) {
            const photoPath = path.join(photosPath, `${id}.${ext}`);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
                deleted = true;
            }
        }

        if (deleted) {
            return { success: true, message: 'Photo deleted successfully' };
        } else {
            return { success: false, error: 'No photo found to delete' };
        }
    } catch (err) {
        console.error('Error deleting photo:', err);
        return { success: false, error: err.message };
    }
});

// ============================================
// PDF EXPORT
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

console.log('✅ Google Sheets Service initialized (Service Account)');
console.log(`📊 Spreadsheet ID: ${SPREADSHEET_ID}`);
console.log(`📁 Photos path: ${photosPath}`);