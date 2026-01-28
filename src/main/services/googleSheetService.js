/* eslint-disable prettier/prettier */
// Google Sheets Service - Complete with all handlers
// Photos remain stored locally in /data/photos

import { ipcMain, BrowserWindow, dialog, shell } from 'electron';
import { google } from 'googleapis';
import XLSX from 'xlsx';  // ✅ FIXED: Static import instead of dynamic
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
 */
async function initializeSheetsAPI() {
    if (sheetsAPI) return sheetsAPI;

    try {
        const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

        const auth = new google.auth.JWT({
            email: serviceAccount.client_email,
            key: serviceAccount.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        await auth.authorize();
        console.log('✅ Service Account authorized');

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

function isCacheValid() {
    if (!cachedData || !cacheTimestamp) return false;
    return (Date.now() - cacheTimestamp) < CACHE_DURATION;
}

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

function rowToStudent(row, rowIndex) {
    if (!row || row.length === 0) return null;

    return {
        id: parseInt(row[0]) || rowIndex,
        Student_ID: row[1] || '',
        Full_Name: row[2] || '',
        Source_Sheet: row[3] || '',
        Cohort: row[4] || '',
        District: row[5] || '',
        Address: row[6] || '',
        Contact_Number: row[7] || '',
        Program: row[8] || '',
        College: row[9] || '',
        Current_Year: row[10] || '',
        Program_Structure: row[11] || '',
        Scholarship_Percentage: row[12] || '',
        Scholarship_Starting_Year: row[13] || '',
        Scholarship_Status: row[14] || '',
        Total_College_Fee: row[15] || '',
        Total_Scholarship_Amount: row[16] || '',
        Total_Due: row[17] || '',
        Books_Total: row[18] || '',
        Uniform_Total: row[19] || '',
        Books_Uniform_Total: row[20] || '',
        Year_1_Fee: row[21] || '',
        Year_1_Payment: row[22] || '',
        Year_2_Fee: row[23] || '',
        Year_3_Fee: row[24] || '',
        Year_4_Fee: row[25] || '',
        Year_1_GPA: row[26] || '',
        Participation: row[27] || '',
        Last_Updated: row[28] || '',
        Year_2_Payment: row[29] || '',
        Year_2_GPA: row[30] || '',
        Remarks: row[31] || '',
        Father_Name: row[32] || '',
        Father_Contact: row[33] || '',
        Mother_Name: row[34] || '',
        Mother_Contact: row[35] || '',
        Scholarship_Type: row[36] || '',
        Total_Amount_Paid: row[37] || '',
        Year_3_Payment: row[38] || '',
        Year_4_Payment: row[39] || '',
        Year_3_GPA: row[40] || '',
        Year_4_GPA: row[41] || '',
        Overall_Status: row[42] || ''
    };
}

function studentToRow(student) {
    return [
        student.id || '',
        student.Student_ID || '',
        student.Full_Name || '',
        student.Source_Sheet || '',
        student.Cohort || '',
        student.District || '',
        student.Address || '',
        student.Contact_Number || '',
        student.Program || '',
        student.College || '',
        student.Current_Year || '',
        student.Program_Structure || '',
        student.Scholarship_Percentage || '',
        student.Scholarship_Starting_Year || '',
        student.Scholarship_Status || '',
        student.Total_College_Fee || '',
        student.Total_Scholarship_Amount || '',
        student.Total_Due || '',
        student.Books_Total || '',
        student.Uniform_Total || '',
        student.Books_Uniform_Total || '',
        student.Year_1_Fee || '',
        student.Year_1_Payment || '',
        student.Year_2_Fee || '',
        student.Year_3_Fee || '',
        student.Year_4_Fee || '',
        student.Year_1_GPA || '',
        student.Participation || '',
        student.Last_Updated || new Date().toISOString(),
        student.Year_2_Payment || '',
        student.Year_2_GPA || '',
        student.Remarks || '',
        student.Father_Name || '',
        student.Father_Contact || '',
        student.Mother_Name || '',
        student.Mother_Contact || '',
        student.Scholarship_Type || '',
        student.Total_Amount_Paid || '',
        student.Year_3_Payment || '',
        student.Year_4_Payment || '',
        student.Year_3_GPA || '',
        student.Year_4_GPA || '',
        student.Overall_Status || ''
    ];
}

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

async function getAllStudents(forceRefresh = false) {
    try {
        if (!forceRefresh && isCacheValid()) {
            console.log('📦 Using cached data');
            return cachedData;
        }

        console.log('📖 Reading from Google Sheets...');

        const sheets = await initializeSheetsAPI();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${MASTER_SHEET}!A2:AL`,
        });

        const rows = response.data.values || [];
        const students = rows
            .map((row, index) => rowToStudent(row, index + 2))
            .filter(s => s !== null);

        cachedData = students;
        cacheTimestamp = Date.now();

        console.log(`✅ Loaded ${students.length} students from Google Sheets`);
        return students;
    } catch (err) {
        console.error('Error getting students from Google Sheets:', err);
        throw err;
    }
}

async function saveStudents(students) {
    try {
        console.log('💾 Saving to Google Sheets...');

        const sheets = await initializeSheetsAPI();
        const rows = students.map(s => studentToRow(s));

        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${MASTER_SHEET}!A2:AL`,
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${MASTER_SHEET}!A2`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: rows }
        });

        cachedData = students;
        cacheTimestamp = Date.now();

        console.log('✅ Saved successfully to Google Sheets');
    } catch (err) {
        console.error('Error saving to Google Sheets:', err);
        throw err;
    }
}

async function getAllParticipations() {
    try {
        const sheets = await initializeSheetsAPI();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${PARTICIPATIONS_SHEET}!A2:J`,
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

function filterStudents(students, { page = 1, limit = 100, search = '', filters = {} } = {}) {
    let filtered = [...students];

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

    for (const key in filters) {
        if (!filters[key] || filters[key] === 'All') continue;
        filtered = filtered.filter(student => (student[key] || '') === filters[key]);
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    return {
        data: paginated,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
}

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

ipcMain.handle('excel:addStudent', async (event, studentData) => {
    try {
        const students = await getAllStudents();
        const sheets = await initializeSheetsAPI();

        const maxId = students.reduce((max, s) => Math.max(max, s.id || 0), 0);
        const newId = maxId + 1;

        const cohort = studentData.Cohort || studentData.Source_Sheet || 'C1';

        const newStudent = {
            id: newId,
            Student_ID: `UGO_${cohort}_${newId}`,
            Source_Sheet: `ACC ${cohort}, ${cohort}, Database`,
            Cohort: cohort,
            ...studentData,
            Last_Updated: new Date().toISOString()
        };

        students.push(newStudent);
        
        // Save to Master_Database
        await saveStudents(students);

        // ✅ Also append to cohort sheet
        const { cohortRow } = await saveStudentToBothSheets(newStudent, sheets);
        
        try {
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `${cohort}!A2`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [cohortRow]
                }
            });
            console.log(`✅ Added to cohort sheet ${cohort}`);
        } catch (sheetErr) {
            console.warn(`⚠️ Could not add to cohort sheet ${cohort}:`, sheetErr.message);
        }

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
 * UPDATED: Update student in both Master_Database and Cohort sheet
 */
ipcMain.handle('excel:updateStudent', async (event, { id, updates }) => {
    try {
        const students = await getAllStudents();
        const sheets = await initializeSheetsAPI();
        const index = students.findIndex(s => s.id === id);

        if (index === -1) {
            return { success: false, error: `Student with ID ${id} not found` };
        }

        const oldStudent = { ...students[index] };
        const oldCohort = oldStudent.Cohort;

        students[index] = {
            ...students[index],
            ...updates,
            id: students[index].id,
            Last_Updated: new Date().toISOString()
        };

        const newCohort = students[index].Cohort;
        const updatedStudent = students[index];

        // Save to Master_Database
        await saveStudents(students);
        console.log(`✅ Updated student in Master_Database`);

        // ✅ Update in cohort sheet(s)
        try {
            if (oldCohort === newCohort) {
                // Same cohort - update existing row
                // Find the student in the cohort sheet
                const cohortData = await sheets.spreadsheets.values.get({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `${oldCohort}!A2:Z`,
                });

                const rows = cohortData.data.values || [];
                const cohortRowIndex = rows.findIndex(row => parseInt(row[0]) === id);

                if (cohortRowIndex !== -1) {
                    // Prepare updated row
                    const cohortRow = [
                        updatedStudent.id || '',
                        updatedStudent.Full_Name || '',
                        updatedStudent.Scholarship_Starting_Year || '',
                        updatedStudent.Current_Year || '',
                        updatedStudent.Scholarship_Type || '',
                        updatedStudent.Scholarship_Percentage || '',
                        updatedStudent.Contact_Number || '',
                        updatedStudent.District || '',
                        updatedStudent.Address || '',
                        updatedStudent.Program || '',
                        updatedStudent.Program_Structure || '',
                        updatedStudent.College || '',
                        updatedStudent.Scholarship_Status || '',
                        updatedStudent.Remarks || '',
                        updatedStudent.Year_1_GPA || '',
                        '',
                        updatedStudent.Year_2_GPA || '',
                        '',
                        updatedStudent.Year_3_GPA || '',
                        '',
                        updatedStudent.Year_4_GPA || '',
                        '',
                        updatedStudent.Overall_Status || '',
                        '',
                        updatedStudent.Participation || ''
                    ];

                    // Update the specific row (add 2 because: 1 for header, 1 for 0-indexing)
                    await sheets.spreadsheets.values.update({
                        spreadsheetId: SPREADSHEET_ID,
                        range: `${oldCohort}!A${cohortRowIndex + 2}:Y${cohortRowIndex + 2}`,
                        valueInputOption: 'USER_ENTERED',
                        resource: {
                            values: [cohortRow]
                        }
                    });

                    console.log(`✅ Updated student in cohort sheet ${oldCohort}`);
                }
            } else {
                // Cohort changed - remove from old, add to new
                console.log(`🔄 Moving student from ${oldCohort} to ${newCohort}`);

                // 1. Remove from old cohort sheet
                const oldCohortData = await sheets.spreadsheets.values.get({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `${oldCohort}!A2:Z`,
                });

                const oldRows = oldCohortData.data.values || [];
                const oldRowIndex = oldRows.findIndex(row => parseInt(row[0]) === id);

                if (oldRowIndex !== -1) {
                    // Get sheet ID for old cohort
                    const spreadsheet = await sheets.spreadsheets.get({
                        spreadsheetId: SPREADSHEET_ID
                    });
                    const oldSheet = spreadsheet.data.sheets.find(s => s.properties.title === oldCohort);

                    if (oldSheet) {
                        // Delete the row
                        await sheets.spreadsheets.batchUpdate({
                            spreadsheetId: SPREADSHEET_ID,
                            resource: {
                                requests: [{
                                    deleteDimension: {
                                        range: {
                                            sheetId: oldSheet.properties.sheetId,
                                            dimension: 'ROWS',
                                            startIndex: oldRowIndex + 1, // +1 for header
                                            endIndex: oldRowIndex + 2
                                        }
                                    }
                                }]
                            }
                        });
                        console.log(`✅ Removed from ${oldCohort} sheet`);
                    }
                }

                // 2. Add to new cohort sheet
                const cohortRow = [
                    updatedStudent.id || '',
                    updatedStudent.Full_Name || '',
                    updatedStudent.Scholarship_Starting_Year || '',
                    updatedStudent.Current_Year || '',
                    updatedStudent.Scholarship_Type || '',
                    updatedStudent.Scholarship_Percentage || '',
                    updatedStudent.Contact_Number || '',
                    updatedStudent.District || '',
                    updatedStudent.Address || '',
                    updatedStudent.Program || '',
                    updatedStudent.Program_Structure || '',
                    updatedStudent.College || '',
                    updatedStudent.Scholarship_Status || '',
                    updatedStudent.Remarks || '',
                    updatedStudent.Year_1_GPA || '',
                    '',
                    updatedStudent.Year_2_GPA || '',
                    '',
                    updatedStudent.Year_3_GPA || '',
                    '',
                    updatedStudent.Year_4_GPA || '',
                    '',
                    updatedStudent.Overall_Status || '',
                    '',
                    updatedStudent.Participation || ''
                ];

                await sheets.spreadsheets.values.append({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `${newCohort}!A2`,
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [cohortRow]
                    }
                });
                console.log(`✅ Added to ${newCohort} sheet`);
            }
        } catch (sheetErr) {
            console.warn(`⚠️ Could not update cohort sheet:`, sheetErr.message);
        }

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
 * UPDATED: Delete student from both Master_Database and Cohort sheet
 */
ipcMain.handle('excel:deleteStudent', async (event, id) => {
    try {
        const students = await getAllStudents();
        const sheets = await initializeSheetsAPI();
        const index = students.findIndex(s => s.id === id);

        if (index === -1) {
            return { success: false, error: `Student with ID ${id} not found` };
        }

        const deletedStudent = students[index];
        const cohort = deletedStudent.Cohort;

        // Remove from students array
        students.splice(index, 1);

        // Save to Master_Database
        await saveStudents(students);
        console.log(`✅ Deleted student from Master_Database: ${deletedStudent.Full_Name} (ID: ${id})`);

        // ✅ Also delete from cohort sheet
        try {
            // Find the student in the cohort sheet
            const cohortData = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `${cohort}!A2:Z`,
            });

            const rows = cohortData.data.values || [];
            const cohortRowIndex = rows.findIndex(row => parseInt(row[0]) === id);

            if (cohortRowIndex !== -1) {
                // Get sheet ID
                const spreadsheet = await sheets.spreadsheets.get({
                    spreadsheetId: SPREADSHEET_ID
                });
                const cohortSheet = spreadsheet.data.sheets.find(s => s.properties.title === cohort);

                if (cohortSheet) {
                    // Delete the row
                    await sheets.spreadsheets.batchUpdate({
                        spreadsheetId: SPREADSHEET_ID,
                        resource: {
                            requests: [{
                                deleteDimension: {
                                    range: {
                                        sheetId: cohortSheet.properties.sheetId,
                                        dimension: 'ROWS',
                                        startIndex: cohortRowIndex + 1, // +1 for header row
                                        endIndex: cohortRowIndex + 2
                                    }
                                }
                            }]
                        }
                    });
                    console.log(`✅ Deleted student from cohort sheet ${cohort}`);
                }
            }
        } catch (sheetErr) {
            console.warn(`⚠️ Could not delete from cohort sheet ${cohort}:`, sheetErr.message);
        }

        return {
            success: true,
            message: `Student "${deletedStudent.Full_Name}" deleted successfully`
        };
    } catch (err) {
        console.error('Error deleting student:', err);
        return { success: false, error: err.message };
    }
});

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

ipcMain.handle('excel:refresh', async () => {
    try {
        const students = await getAllStudents(true);

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
// COHORT HANDLERS
// ============================================

/**
 * Extract cohort from various formats
 * Handles: "C1", "C2", "ACC C1, C1, Database", "ACC C2, C2, Database"
 * Returns: "C1", "C2", etc.
 */
function extractCohort(value) {
    if (!value) return null;

    const strValue = String(value).trim();

    // Method 1: Direct match (e.g., "C1", "C2")
    if (/^C\d+$/.test(strValue)) {
        return strValue;
    }

    // Method 2: Extract from "ACC C1, C1, Database" or similar
    // This will match the first occurrence of C followed by digits
    const match = strValue.match(/\bC(\d+)\b/);
    if (match) {
        return `C${match[1]}`;
    }

    return null;
}

ipcMain.handle('excel:getCohorts', async () => {
    try {
        const sheets = await initializeSheetsAPI();
        
        // Get all sheet tabs from the spreadsheet
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID
        });

        // Extract cohort sheets (C1, C2, C3, C4, etc.)
        const cohorts = spreadsheet.data.sheets
            .map(sheet => sheet.properties.title)
            .filter(title => /^C\d+$/.test(title))
            .sort((a, b) => {
                const numA = parseInt(a.substring(1));
                const numB = parseInt(b.substring(1));
                return numA - numB;
            });

        console.log('📚 Found cohort sheets:', cohorts);

        return {
            success: true,
            cohorts: cohorts.length > 0 ? cohorts : ['C1']
        };
    } catch (err) {
        console.error('Error getting cohorts:', err);
        return { success: false, error: err.message, cohorts: ['C1'] };
    }
});

/**
 * Add a new cohort sheet to Google Sheets
 * Creates a new sheet tab with proper headers
 */
ipcMain.handle('excel:addCohort', async (event, cohortName) => {
    try {
        if (!/^C\d+$/.test(cohortName)) {
            return {
                success: false,
                error: 'Invalid cohort name. Must be in format C1, C2, C3, etc.'
            };
        }

        console.log(`📝 Checking if sheet exists: ${cohortName}`);

        const sheets = await initializeSheetsAPI();

        // Check if sheet already exists
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID
        });

        const existingSheet = spreadsheet.data.sheets.find(
            sheet => sheet.properties.title === cohortName
        );

        if (existingSheet) {
            return {
                success: false,
                error: `Sheet ${cohortName} already exists. You can select it from the dropdown.`
            };
        }

        // Rest of the creation code stays the same...
        const headers = [
            'S.N',
            'Full Name',
            'Scholarship Starting Year',
            'Current Year',
            'Scholarship Type',
            'Scholarship %',
            'Contact Number',
            'District',
            'Address',
            'Program',
            'Program Structure (Year/Semester)',
            'College',
            'Scholarship Status',
            'Remarks',
            'Year 1 GPA',
            'Unnamed: 15',
            'Year 2 GPA',
            'Unnamed: 17',
            'Year 3 GPA',
            'Unnamed: 19',
            'Year 4 Gpa',
            'Unnamed: 21',
            'Overall Status',
            'Unnamed: 23',
            'Participation in Activities'
        ];

        const addSheetResponse = await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                requests: [{
                    addSheet: {
                        properties: {
                            title: cohortName,
                            gridProperties: {
                                rowCount: 1000,
                                columnCount: 26,
                                frozenRowCount: 1
                            }
                        }
                    }
                }]
            }
        });

        const newSheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${cohortName}!A1:Y1`,
            valueInputOption: 'RAW',
            resource: {
                values: [headers]
            }
        });

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                requests: [
                    {
                        repeatCell: {
                            range: {
                                sheetId: newSheetId,
                                startRowIndex: 0,
                                endRowIndex: 1
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: {
                                        red: 0.8,
                                        green: 0.8,
                                        blue: 0.8
                                    },
                                    textFormat: {
                                        bold: true
                                    }
                                }
                            },
                            fields: 'userEnteredFormat(backgroundColor,textFormat)'
                        }
                    }
                ]
            }
        });

        console.log(`✅ Created sheet ${cohortName}`);

        return {
            success: true,
            message: `Cohort sheet ${cohortName} created successfully`,
            cohortName,
            sheetId: newSheetId
        };
    } catch (err) {
        console.error('Error adding cohort sheet:', err);
        return { success: false, error: err.message };
    }
});

// ============================================
// HELPER: Write to both Master_Database and Cohort Sheet
// ============================================

/**
 * Write student data to both Master_Database and their cohort sheet
 */
async function saveStudentToBothSheets(student, sheets) {
    const cohort = student.Cohort || student.Source_Sheet || 'C1';

    // Row for Master_Database (full data)
    const masterRow = studentToRow(student);

    // Row for Cohort sheet (simplified format matching C1, C2 structure)
    const cohortRow = [
        student.id || '',
        student.Full_Name || '',
        student.Scholarship_Starting_Year || '',
        student.Current_Year || '',
        student.Scholarship_Type || '',
        student.Scholarship_Percentage || '',
        student.Contact_Number || '',
        student.District || '',
        student.Address || '',
        student.Program || '',
        student.Program_Structure || '',
        student.College || '',
        student.Scholarship_Status || '',
        student.Remarks || '',
        student.Year_1_GPA || '',
        '',  // Unnamed column
        student.Year_2_GPA || '',
        '',  // Unnamed column
        student.Year_3_GPA || '',
        '',  // Unnamed column
        student.Year_4_GPA || '',
        '',  // Unnamed column
        student.Overall_Status || '',
        '',  // Unnamed column
        student.Participation || ''
    ];

    return { masterRow, cohortRow, cohort };
}

// ============================================
// DIAGNOSTIC HANDLER (for debugging cohort issues)
// ============================================

/**
 * Diagnostic handler to inspect raw data and cohort extraction
 */
ipcMain.handle('excel:diagnosticCohorts', async () => {
    try {
        const students = await getAllStudents();

        console.log('='.repeat(80));
        console.log('COHORT DIAGNOSTIC REPORT');
        console.log('='.repeat(80));
        console.log(`Total students: ${students.length}`);
        console.log('');

        // Sample first 5 students
        console.log('First 5 students:');
        students.slice(0, 5).forEach((student, index) => {
            console.log(`\nStudent ${index + 1}:`);
            console.log(`  ID: ${student.id}`);
            console.log(`  Student_ID: ${student.Student_ID}`);
            console.log(`  Full_Name: ${student.Full_Name}`);
            console.log(`  Source_Sheet: "${student.Source_Sheet}"`);
            console.log(`  Cohort: "${student.Cohort}"`);
            console.log(`  Extracted from Source_Sheet: ${extractCohort(student.Source_Sheet)}`);
            console.log(`  Extracted from Cohort: ${extractCohort(student.Cohort)}`);
        });

        console.log('\n' + '='.repeat(80));

        // Count cohorts by each method
        const cohortsByCohortColumn = new Set();
        const cohortsBySourceSheet = new Set();
        const cohortsByStudentId = new Set();

        students.forEach(student => {
            // Use extractCohort for Cohort column
            const cohortFromColumn = extractCohort(student.Cohort);
            if (cohortFromColumn) cohortsByCohortColumn.add(cohortFromColumn);

            // Use extractCohort for Source_Sheet
            const cohortFromSource = extractCohort(student.Source_Sheet);
            if (cohortFromSource) cohortsBySourceSheet.add(cohortFromSource);

            // Extract from Student_ID
            if (student.Student_ID) {
                const match = student.Student_ID.match(/UGO_C(\d+)_/);
                if (match) cohortsByStudentId.add(`C${match[1]}`);
            }
        });

        console.log('\nCohorts found by Cohort column:', Array.from(cohortsByCohortColumn));
        console.log('Cohorts found by Source_Sheet column:', Array.from(cohortsBySourceSheet));
        console.log('Cohorts found by Student_ID parsing:', Array.from(cohortsByStudentId));
        console.log('='.repeat(80));

        return {
            success: true,
            totalStudents: students.length,
            sampleStudents: students.slice(0, 5).map(s => ({
                id: s.id,
                Student_ID: s.Student_ID,
                Full_Name: s.Full_Name,
                Source_Sheet: s.Source_Sheet,
                Cohort: s.Cohort,
                extractedFromSource: extractCohort(s.Source_Sheet),
                extractedFromCohort: extractCohort(s.Cohort)
            })),
            cohortsByCohortColumn: Array.from(cohortsByCohortColumn),
            cohortsBySourceSheet: Array.from(cohortsBySourceSheet),
            cohortsByStudentId: Array.from(cohortsByStudentId)
        };
    } catch (err) {
        console.error('Error in diagnostic:', err);
        return { success: false, error: err.message };
    }
});

/**
 * ONE-TIME FIX: Populate empty Cohort and Source_Sheet columns
 * Extracts cohort from Student_ID field (e.g., UGO_C1_123 -> C1)
 */
ipcMain.handle('excel:fixCohortColumns', async () => {
    try {
        console.log('🔧 Starting cohort column fix...');

        const students = await getAllStudents();
        let updatedCount = 0;
        let errorCount = 0;

        // Update each student
        students.forEach((student, index) => {
            const needsUpdate = !student.Cohort || !student.Source_Sheet;

            if (needsUpdate && student.Student_ID) {
                // Extract cohort from Student_ID (e.g., UGO_C1_123 -> C1)
                const match = student.Student_ID.match(/UGO_([^_]+)_/);

                if (match && /^C\d+$/.test(match[1])) {
                    const cohort = match[1];
                    student.Cohort = cohort;
                    student.Source_Sheet = cohort;
                    updatedCount++;

                    if (updatedCount <= 5) {
                        console.log(`  ✅ Student ${student.id}: ${student.Full_Name} -> Cohort: ${cohort}`);
                    }
                } else {
                    errorCount++;
                    if (errorCount <= 5) {
                        console.log(`  ❌ Student ${student.id}: Invalid Student_ID format: ${student.Student_ID}`);
                    }
                }
            }
        });

        if (updatedCount > 0) {
            await saveStudents(students);
            console.log(`\n✅ Fixed ${updatedCount} students`);
        }

        if (errorCount > 0) {
            console.log(`⚠️  ${errorCount} students have invalid Student_ID format`);
        }

        return {
            success: true,
            message: `Updated ${updatedCount} students`,
            updated: updatedCount,
            errors: errorCount
        };
    } catch (err) {
        console.error('Error fixing cohort columns:', err);
        return { success: false, error: err.message };
    }
});

// ============================================
// IMPORT HANDLER
// ============================================

ipcMain.handle('excel:importFile', async (event, { filePath, sourceSheet }) => {
    try {
        console.log('📥 Importing from:', filePath);

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const importedData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        console.log(`📊 Found ${importedData.length} students to import`);

        const currentStudents = await getAllStudents();
        const sheets = await initializeSheetsAPI();
        const maxId = currentStudents.reduce((max, s) => Math.max(max, s.id || 0), 0);

        const newStudents = importedData.map((student, index) => {
            const globalId = maxId + index + 1;

            return {
                id: globalId,
                Student_ID: `UGO_${sourceSheet}_${globalId}`,
                Full_Name: student.Full_Name || student['Full Name'] || '',
                Source_Sheet: `ACC ${sourceSheet}, ${sourceSheet}, Database`,
                Cohort: sourceSheet,
                District: student.District || '',
                Address: student.Address || '',
                Contact_Number: student.Contact_Number || student['Contact Number'] || '',
                Program: student.Program || '',
                College: student.College || '',
                Current_Year: student.Current_Year || student['Current Year'] || '',
                Program_Structure: student.Program_Structure || student['Program Structure'] || '',
                Scholarship_Percentage: student.Scholarship_Percentage || student['Scholarship %'] || '',
                Scholarship_Starting_Year: student.Scholarship_Starting_Year || student['Scholarship Starting Year'] || '',
                Scholarship_Status: student.Scholarship_Status || student['Scholarship Status'] || '',
                Total_College_Fee: student.Total_College_Fee || student['Total College Fee'] || '',
                Total_Scholarship_Amount: student.Total_Scholarship_Amount || student['Total Scholarship Amount'] || '',
                Total_Due: student.Total_Due || student['Total Due'] || '',
                Books_Total: student.Books_Total || student['Books Total'] || '',
                Uniform_Total: student.Uniform_Total || student['Uniform Total'] || '',
                Books_Uniform_Total: student.Books_Uniform_Total || '',
                Year_1_Fee: student.Year_1_Fee || '',
                Year_1_Payment: student.Year_1_Payment || student['Year 1 Payment'] || '',
                Year_2_Fee: student.Year_2_Fee || '',
                Year_3_Fee: student.Year_3_Fee || '',
                Year_4_Fee: student.Year_4_Fee || '',
                Year_1_GPA: student.Year_1_GPA || student['Year 1 GPA'] || '',
                Participation: student.Participation || '',
                Last_Updated: new Date().toISOString(),
                Year_2_Payment: student.Year_2_Payment || '',
                Year_2_GPA: student.Year_2_GPA || student['Year 2 GPA'] || '',
                Remarks: student.Remarks || '',
                Father_Name: student.Father_Name || student["Father's Name"] || '',
                Father_Contact: student.Father_Contact || student["Father's Contact"] || '',
                Mother_Name: student.Mother_Name || student["Mother's Name"] || '',
                Mother_Contact: student.Mother_Contact || student["Mother's Contact"] || '',
                Scholarship_Type: student.Scholarship_Type || student['Scholarship Type'] || '',
                Total_Amount_Paid: student.Total_Amount_Paid || student['Total Amount Paid'] || '',
                Year_3_Payment: student.Year_3_Payment || student['Year 3 Payment'] || '',
                Year_4_Payment: student.Year_4_Payment || student['Year 4 Payment'] || '',
                Year_3_GPA: student.Year_3_GPA || student['Year 3 GPA'] || '',
                Year_4_GPA: student.Year_4_GPA || student['Year 4 GPA'] || '',
                Overall_Status: student.Overall_Status || student['Overall Status'] || ''
            };
        });

        const mergedStudents = [...currentStudents, ...newStudents];
        
        // Save to Master_Database
        await saveStudents(mergedStudents);

        // ✅ Also write to cohort sheet
        const cohortRows = newStudents.map(s => {
            const { cohortRow } = saveStudentToBothSheets(s, sheets);
            return cohortRow;
        });

        try {
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `${sourceSheet}!A2`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: cohortRows
                }
            });
            console.log(`✅ Added ${newStudents.length} students to cohort sheet ${sourceSheet}`);
        } catch (sheetErr) {
            console.warn(`⚠️ Could not add to cohort sheet ${sourceSheet}:`, sheetErr.message);
        }

        console.log(`✅ Imported ${newStudents.length} new students`);

        return {
            success: true,
            message: `Successfully imported ${newStudents.length} students`,
            imported: newStudents.length,
            total: mergedStudents.length,
            firstId: newStudents[0]?.Student_ID,
            lastId: newStudents[newStudents.length - 1]?.Student_ID
        };
    } catch (err) {
        console.error('Error importing file:', err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('excel:getPath', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }]
    });

    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }

    return result.filePaths[0];
});

// ============================================
// IPC HANDLERS - PARTICIPATIONS
// ============================================

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

// ✅ NEW: Get all participations (for reports/analytics)
ipcMain.handle('excel:getAllParticipations', async (event, params = {}) => {
    try {
        const participations = await getAllParticipations();
        const result = filterStudents(participations, params);
        return { success: true, ...result };
    } catch (err) {
        console.error('Error getting all participations:', err);
        return { success: false, error: err.message };
    }
});

// ============================================
// IPC HANDLERS - PHOTOS (LOCAL STORAGE)
// ============================================

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

// ✅ NEW: Check if photo exists
ipcMain.handle('photos:exists', async (event, id) => {
    try {
        const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        for (const ext of extensions) {
            const photoPath = path.join(photosPath, `${id}.${ext}`);
            if (fs.existsSync(photoPath)) {
                return {
                    success: true,
                    exists: true,
                    path: `atom://${path.resolve(photoPath)}`
                };
            }
        }

        return { success: true, exists: false };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

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