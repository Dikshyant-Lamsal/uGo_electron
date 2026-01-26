/* eslint-disable prettier/prettier */
import { ipcMain, BrowserWindow, dialog, shell, app } from 'electron';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';

// __dirname replacement for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to Excel file
const excelPath = path.resolve(__dirname, '../../data/students.xlsx');

// Photo path
const photosPath = path.resolve(__dirname, '../../data/photos');

// Ensure photos directory exists
if (!fs.existsSync(photosPath)) {
    fs.mkdirSync(photosPath, { recursive: true });
}

// Cache for performance
let cachedData = null;
let lastModified = null;

// --- Helpers ---

/**
 * Check if cache is valid
 */
function isCacheValid() {
    if (!cachedData || !lastModified) return false;

    try {
        const stats = fs.statSync(excelPath);
        return stats.mtime.getTime() === lastModified;
    } catch (err) {
        return false;
    }
}

// Helper to restore focus
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
 * Read all sheets
 */
function getSheets() {
    const workbook = XLSX.readFile(excelPath);
    return workbook.SheetNames;
}

/**
 * Read data from a specific sheet
 */
function getSheetData(sheetName) {
    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);
    return XLSX.utils.sheet_to_json(sheet);
}

/**
 * Get all students from Master_Database sheet with caching
 */
function getAllStudents(forceRefresh = false) {
    if (!forceRefresh && isCacheValid()) {
        console.log('📦 Using cached data');
        return cachedData;
    }

    console.log('📖 Reading Excel file...');
    const students = getSheetData('Master_Database');

    // Update cache
    cachedData = students;
    const stats = fs.statSync(excelPath);
    lastModified = stats.mtime.getTime();

    console.log(`✅ Loaded ${students.length} students`);
    return students;
}

/**
 * Write students back to Master_Database sheet
 */
function saveStudents(students) {
    console.log('💾 Saving to Excel...');

    // Read existing workbook
    const workbook = XLSX.readFile(excelPath);

    // Convert students to worksheet
    const worksheet = XLSX.utils.json_to_sheet(students);

    // Replace Master_Database sheet
    workbook.Sheets['Master_Database'] = worksheet;

    // Write file
    XLSX.writeFile(workbook, excelPath);

    // Update cache
    cachedData = students;
    const stats = fs.statSync(excelPath);
    lastModified = stats.mtime.getTime();

    console.log('✅ Saved successfully');
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
        // Count by district
        if (student.District) {
            stats.byDistrict[student.District] = (stats.byDistrict[student.District] || 0) + 1;
        }

        // Count by college
        if (student.College) {
            stats.byCollege[student.College] = (stats.byCollege[student.College] || 0) + 1;
        }

        // Count by program
        if (student.Program) {
            stats.byProgram[student.Program] = (stats.byProgram[student.Program] || 0) + 1;
        }

        // Count by year
        if (student.Current_Year) {
            stats.byYear[student.Current_Year] = (stats.byYear[student.Current_Year] || 0) + 1;
        }

        // Count by source sheet
        if (student.Source_Sheet) {
            stats.bySource[student.Source_Sheet] = (stats.bySource[student.Source_Sheet] || 0) + 1;
        }

        // Count by cohort
        if (student.Cohort) {
            stats.byCohort[student.Cohort] = (stats.byCohort[student.Cohort] || 0) + 1;
        }

        // Financial summary
        stats.financialSummary.totalFees += parseFloat(student.Total_College_Fee || 0);
        stats.financialSummary.totalScholarship += parseFloat(student.Total_Scholarship_Amount || 0);
        stats.financialSummary.totalPaid += parseFloat(student.Total_Amount_Paid || 0);
        stats.financialSummary.totalDue += parseFloat(student.Total_Due || 0);
    });

    return stats;
}

// --- IPC Handlers ---

/**
 * Get all students with filters
 */
ipcMain.handle('excel:getStudents', (event, params) => {
    try {
        const students = getAllStudents();
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
ipcMain.handle('excel:getStudent', (event, id) => {
    try {
        const students = getAllStudents();
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

ipcMain.handle('excel:addStudent', (event, studentData) => {
    try {
        const students = getAllStudents();

        // Generate new GLOBAL ID
        const maxId = students.reduce((max, s) => Math.max(max, s.id || 0), 0);
        const newId = maxId + 1;

        // Get cohort from student data
        const cohort = studentData.Source_Sheet || 'C1';

        // Create new student with GLOBAL sequential ID
        const newStudent = {
            id: newId,
            Student_ID: `UGO_${cohort}_${newId}`,  // e.g., UGO_C1_274
            ...studentData,
            Last_Updated: new Date().toISOString()
        };

        // Add to array
        students.push(newStudent);

        // Save to Excel
        saveStudents(students);

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
ipcMain.handle('excel:updateStudent', (event, { id, updates }) => {
    try {
        const students = getAllStudents();
        const index = students.findIndex(s => s.id === id);

        if (index === -1) {
            return { success: false, error: `Student with ID ${id} not found` };
        }

        // Update student
        students[index] = {
            ...students[index],
            ...updates,
            id: students[index].id, // Preserve original ID
            Last_Updated: new Date().toISOString()
        };

        // Save to Excel
        saveStudents(students);

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
ipcMain.handle('excel:deleteStudent', (event, id) => {
    try {
        const students = getAllStudents();
        const index = students.findIndex(s => s.id === id);

        if (index === -1) {
            return { success: false, error: `Student with ID ${id} not found` };
        }

        const deletedStudent = students[index];

        // Remove student
        students.splice(index, 1);

        // Save to Excel
        saveStudents(students);

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
ipcMain.handle('excel:getStats', () => {
    try {
        const students = getAllStudents();
        const stats = calculateStats(students);

        return {
            success: true,
            stats,
            fileInfo: {
                lastModified: new Date(lastModified).toISOString(),
                totalStudents: students.length
            }
        };
    } catch (err) {
        console.error('Error getting stats:', err);
        return { success: false, error: err.message };
    }
});

/**
 * Refresh data from Excel
 */
ipcMain.handle('excel:refresh', () => {
    try {
        const students = getAllStudents(true); // Force refresh

        return {
            success: true,
            message: 'Data refreshed successfully',
            stats: {
                totalStudents: students.length
            }
        };
    } catch (err) {
        console.error('Error refreshing data:', err);
        return { success: false, error: err.message };
    }
});

/**
 * Get all sheet names
 */
ipcMain.handle('excel:getSheets', () => {
    try {
        const sheets = getSheets();
        return { success: true, sheets };
    } catch (err) {
        console.error('Error getting sheets:', err);
        return { success: false, error: err.message };
    }
});

/**
 * Get data from any sheet with optional pagination/search
 */
ipcMain.handle('excel:getSheetData', (event, { sheetName, page, limit, search }) => {
    try {
        const data = getSheetData(sheetName);
        const result = filterStudents(data, { page, limit, search });
        return { success: true, sheetName, ...result };
    } catch (err) {
        console.error('Error getting sheet data:', err);
        return { success: false, error: err.message };
    }
});

/**
 * Save student photo
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

        restoreFocus(); // ✅ Restore focus after save

        return {
            success: true,
            message: 'Photo saved successfully',
            path: `atom://${photoPath}`
        };
    } catch (err) {
        console.error('Error saving photo:', err);
        restoreFocus(); // ✅ Restore focus on error
        return { success: false, error: err.message };
    }
});

/**
 * Check if photo exists
 */
ipcMain.handle('photos:exists', async (event, id) => {
    try {
        const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        for (const ext of extensions) {
            const photoPath = path.join(photosPath, `${id}.${ext}`);
            if (fs.existsSync(photoPath)) {
                return {
                    success: true,
                    exists: true,
                    path: `atom://${photoPath}`  // ✅ Changed to atom://
                };
            }
        }

        return { success: true, exists: false };
    } catch (err) {
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
                // Normalize the path - resolve removes double slashes and normalizes
                const normalizedPath = path.resolve(photoPath);

                console.log('📸 Original path:', photoPath);
                console.log('📸 Normalized path:', normalizedPath);
                console.log('📸 atom:// URL:', `atom://${normalizedPath}`);

                return {
                    success: true,
                    path: `atom://${normalizedPath}`
                };
            }
        }

        console.log('❌ No photo found for student ID:', id);
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
                console.log(`✅ Deleted photo for student ID ${id}`);
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
// PARTICIPATION HANDLERS
// ============================================

/**
 * Get all participations for a student
 */
ipcMain.handle('excel:getParticipations', (event, studentId) => {
    try {
        const participations = getSheetData('Participations');
        const studentParticipations = participations.filter(p => p.student_id === studentId);

        // Sort by date descending (newest first)
        studentParticipations.sort((a, b) =>
            new Date(b.event_date) - new Date(a.event_date)
        );

        console.log(`📋 Found ${studentParticipations.length} participations for student ${studentId}`);

        return {
            success: true,
            data: studentParticipations
        };
    } catch (err) {
        console.error('Error getting participations:', err);
        return { success: false, error: err.message, data: [] };
    }
});

/**
 * Get single participation by ID
 */
ipcMain.handle('excel:getParticipation', (event, id) => {
    try {
        const participations = getSheetData('Participations');
        const participation = participations.find(p => p.participation_id === id);

        if (!participation) {
            return { success: false, error: 'Participation not found' };
        }

        return { success: true, data: participation };
    } catch (err) {
        console.error('Error getting participation:', err);
        return { success: false, error: err.message };
    }
});

/**
 * Add new participation
 */
ipcMain.handle('excel:addParticipation', (event, participationData) => {
    try {
        console.log('📝 Adding participation:', participationData);

        // Read current participations
        const workbook = XLSX.readFile(excelPath);

        // Check if Participations sheet exists
        if (!workbook.SheetNames.includes('Participations')) {
            // Create new sheet if it doesn't exist
            const newSheet = XLSX.utils.json_to_sheet([]);
            workbook.Sheets['Participations'] = newSheet;
            workbook.SheetNames.push('Participations');
        }

        const participations = getSheetData('Participations');

        // Generate new ID
        const maxId = participations.reduce((max, p) => Math.max(max, p.participation_id || 0), 0);
        const newId = maxId + 1;

        // Create new participation
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

        // Add to array
        participations.push(newParticipation);

        // Convert to worksheet and save
        const worksheet = XLSX.utils.json_to_sheet(participations);
        workbook.Sheets['Participations'] = worksheet;
        XLSX.writeFile(workbook, excelPath);

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
ipcMain.handle('excel:updateParticipation', (event, { id, updates }) => {
    try {
        console.log(`📝 Updating participation ${id}:`, updates);

        const workbook = XLSX.readFile(excelPath);
        const participations = getSheetData('Participations');
        const index = participations.findIndex(p => p.participation_id === id);

        if (index === -1) {
            return { success: false, error: `Participation with ID ${id} not found` };
        }

        // Update participation
        participations[index] = {
            ...participations[index],
            ...updates,
            participation_id: participations[index].participation_id, // Preserve ID
            student_id: participations[index].student_id, // Preserve student_id
            updated_at: new Date().toISOString()
        };

        // Save back to Excel
        const worksheet = XLSX.utils.json_to_sheet(participations);
        workbook.Sheets['Participations'] = worksheet;
        XLSX.writeFile(workbook, excelPath);

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
ipcMain.handle('excel:deleteParticipation', (event, id) => {
    try {
        console.log(`🗑️ Deleting participation ${id}`);

        const workbook = XLSX.readFile(excelPath);
        const participations = getSheetData('Participations');
        const index = participations.findIndex(p => p.participation_id === id);

        if (index === -1) {
            return { success: false, error: `Participation with ID ${id} not found` };
        }

        const deletedParticipation = participations[index];

        // Remove participation
        participations.splice(index, 1);

        // Save back to Excel
        const worksheet = XLSX.utils.json_to_sheet(participations);
        workbook.Sheets['Participations'] = worksheet;
        XLSX.writeFile(workbook, excelPath);

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

/**
 * Get all participations (for reports/analytics)
 */
ipcMain.handle('excel:getAllParticipations', (event, params = {}) => {
    try {
        const participations = getSheetData('Participations');
        const result = filterStudents(participations, params);
        return { success: true, ...result };
    } catch (err) {
        console.error('Error getting all participations:', err);
        return { success: false, error: err.message };
    }
});

// Save PDF handler
ipcMain.handle('save-pdf', async (event, { htmlContent, defaultFileName, openAfterSave = true }) => {
    try {
        const { filePath, canceled } = await dialog.showSaveDialog({
            title: 'Save PDF',
            defaultPath: defaultFileName || 'student-profile.pdf',
            filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
        });

        if (canceled || !filePath) {
            restoreFocus(); // ✅ Restore focus on cancel
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

        console.log(`✅ PDF saved: ${filePath}`);

        if (openAfterSave) {
            await shell.openPath(filePath);
        }

        restoreFocus(); // ✅ Restore focus after save

        return { success: true, filePath };
    } catch (error) {
        console.error('❌ Error saving PDF:', error);
        restoreFocus(); // ✅ Restore focus on error
        return { success: false, error: error.message };
    }
});

/**
 * Import students from uploaded Excel file
 */
/**
 * Import students from uploaded Excel file
 */
ipcMain.handle('excel:importFile', async (event, { filePath, sourceSheet }) => {
    try {
        console.log('📥 Importing from:', filePath);

        // Read uploaded Excel file
        const workbook = XLSX.readFile(filePath);

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const importedData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        console.log(`📊 Found ${importedData.length} students to import`);

        // Get current students
        const currentStudents = getAllStudents();

        // Find max GLOBAL numeric ID across ALL students
        const maxId = currentStudents.reduce((max, s) => Math.max(max, s.id || 0), 0);

        console.log(`📋 Max Global ID: ${maxId}`);
        console.log(`📋 Next students will be: ${maxId + 1} to ${maxId + importedData.length}`);

        // Process imported students
        const newStudents = importedData.map((student, index) => {
            const globalId = maxId + index + 1;  // Global sequential: 274, 275, 276...

            return {
                id: globalId,  // Global numeric ID
                Student_ID: `UGO_${sourceSheet}_${globalId}`,  // e.g., UGO_C1_274, UGO_C1_275
                Full_Name: student.Full_Name || student['Full Name'] || '',
                District: student.District || '',
                Address: student.Address || '',
                Contact_Number: student.Contact_Number || student['Contact Number'] || '',
                Father_Name: student.Father_Name || student["Father's Name"] || '',
                Father_Contact: student.Father_Contact || student["Father's Contact"] || '',
                Mother_Name: student.Mother_Name || student["Mother's Name"] || '',
                Mother_Contact: student.Mother_Contact || student["Mother's Contact"] || '',
                Program: student.Program || '',
                College: student.College || '',
                Current_Year: student.Current_Year || student['Current Year'] || '',
                Program_Structure: student.Program_Structure || student['Program Structure'] || '',
                Scholarship_Type: student.Scholarship_Type || student['Scholarship Type'] || '',
                Scholarship_Percentage: student.Scholarship_Percentage || student['Scholarship %'] || '',
                Scholarship_Starting_Year: student.Scholarship_Starting_Year || student['Scholarship Starting Year'] || '',
                Scholarship_Status: student.Scholarship_Status || student['Scholarship Status'] || '',
                Total_College_Fee: student.Total_College_Fee || student['Total College Fee'] || '',
                Total_Scholarship_Amount: student.Total_Scholarship_Amount || student['Total Scholarship Amount'] || '',
                Total_Amount_Paid: student.Total_Amount_Paid || student['Total Amount Paid'] || '',
                Total_Due: student.Total_Due || student['Total Due'] || '',
                Books_Total: student.Books_Total || student['Books Total'] || '',
                Uniform_Total: student.Uniform_Total || student['Uniform Total'] || '',
                Year_1_Fee: student.Year_1_Fee || student['Year 1 Fee'] || '',
                Year_1_Payment: student.Year_1_Payment || student['Year 1 Payment'] || '',
                Year_2_Fee: student.Year_2_Fee || student['Year 2 Fee'] || '',
                Year_2_Payment: student.Year_2_Payment || student['Year 2 Payment'] || '',
                Year_3_Fee: student.Year_3_Fee || student['Year 3 Fee'] || '',
                Year_3_Payment: student.Year_3_Payment || student['Year 3 Payment'] || '',
                Year_4_Fee: student.Year_4_Fee || student['Year 4 Fee'] || '',
                Year_4_Payment: student.Year_4_Payment || student['Year 4 Payment'] || '',
                Year_1_GPA: student.Year_1_GPA || student['Year 1 GPA'] || '',
                Year_2_GPA: student.Year_2_GPA || student['Year 2 GPA'] || '',
                Year_3_GPA: student.Year_3_GPA || student['Year 3 GPA'] || '',
                Year_4_GPA: student.Year_4_GPA || student['Year 4 GPA'] || '',
                Overall_Status: student.Overall_Status || student['Overall Status'] || '',
                Participation: student.Participation || '',
                Remarks: student.Remarks || '',
                Source_Sheet: sourceSheet,
                Last_Updated: new Date().toISOString()
            };
        });

        // Merge with existing students
        const mergedStudents = [...currentStudents, ...newStudents];

        // Save to Excel
        saveStudents(mergedStudents);

        console.log(`✅ Imported ${newStudents.length} new students`);
        console.log(`   Student IDs: ${newStudents[0]?.Student_ID} to ${newStudents[newStudents.length - 1]?.Student_ID}`);

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

    return result.filePaths[0]; // absolute file path
});

ipcMain.on('devtools-refresh', (event) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.webContents.openDevTools({ mode: 'detach' });
        setTimeout(() => win.webContents.closeDevTools(), 100);
    }
});

// ============================================
// COHORT MANAGEMENT
// ============================================

/**
 * Get list of available cohorts (C1, C2, C3, ...)
 */
ipcMain.handle('excel:getCohorts', () => {
    try {
        const workbook = XLSX.readFile(excelPath);
        const cohortSheets = workbook.SheetNames.filter(name => /^C\d+$/.test(name));

        // Sort cohorts numerically (C1, C2, C3, ...)
        cohortSheets.sort((a, b) => {
            const numA = parseInt(a.substring(1));
            const numB = parseInt(b.substring(1));
            return numA - numB;
        });

        console.log('📚 Available cohorts:', cohortSheets);

        return {
            success: true,
            cohorts: cohortSheets
        };
    } catch (err) {
        console.error('Error getting cohorts:', err);
        return { success: false, error: err.message, cohorts: [] };
    }
});

/**
 * Add a new cohort sheet to the Excel file
 */
ipcMain.handle('excel:addCohort', (event, cohortName) => {
    try {
        // Validate cohort name format (must be C followed by numbers)
        if (!/^C\d+$/.test(cohortName)) {
            return {
                success: false,
                error: 'Invalid cohort name. Must be in format C1, C2, C3, etc.'
            };
        }

        console.log(`📝 Adding new cohort sheet: ${cohortName}`);

        // Read existing workbook
        const workbook = XLSX.readFile(excelPath);

        // Check if cohort already exists
        if (workbook.SheetNames.includes(cohortName)) {
            return {
                success: false,
                error: `Cohort ${cohortName} already exists`
            };
        }

        // Create template structure based on C1 sheet format
        const templateData = [
            {
                'S.N': '',
                'Full Name': '',
                'Scholarship Starting Year': '',
                'Current Year': '',
                'Scholarship Type': '',
                'Scholarship %': '',
                'Contact Number': '',
                'District': '',
                'Address': '',
                'Program': '',
                'Program Structure (Year/Semester)': '',
                'College': '',
                'Scholarship Status': '',
                'Remarks': '',
                'Year 1 GPA': '',
                'Unnamed: 15': '',
                'Year 2 GPA': '',
                'Unnamed: 17': '',
                'Year 3 GPA': '',
                'Unnamed: 19': '',
                'Year 4 Gpa': '',
                'Unnamed: 21': '',
                'Overall Status': '',
                'Unnamed: 23': '',
                'Participation in Activities': ''
            }
        ];

        // Create new worksheet
        const newWorksheet = XLSX.utils.json_to_sheet(templateData);

        // Add the new sheet to workbook
        XLSX.utils.book_append_sheet(workbook, newWorksheet, cohortName);

        // Save workbook
        XLSX.writeFile(workbook, excelPath);

        console.log(`✅ Created new cohort sheet: ${cohortName}`);

        return {
            success: true,
            message: `Cohort ${cohortName} created successfully`,
            cohortName
        };
    } catch (err) {
        console.error('Error adding cohort:', err);
        return { success: false, error: err.message };
    }
});

/**
 * Run Python consolidator script
 */
ipcMain.handle('excel:runConsolidator', async () => {
    try {
        console.log('🔄 Running Python consolidator script...');

        // Get script path
        const scriptPath = path.resolve(__dirname, '../../scripts/smart_consolidator.py');

        // Check if Python is available
        const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

        return new Promise((resolve, reject) => {
            const process = spawn(pythonCommand, [scriptPath]);

            let output = '';
            let errorOutput = '';

            process.stdout.on('data', (data) => {
                const text = data.toString();
                console.log(text);
                output += text;
            });

            process.stderr.on('data', (data) => {
                const text = data.toString();
                console.error(text);
                errorOutput += text;
            });

            process.on('close', (code) => {
                if (code === 0) {
                    // Success - refresh cache
                    readExcelFile();

                    resolve({
                        success: true,
                        message: 'Consolidation completed successfully',
                        output: output
                    });
                } else {
                    reject({
                        success: false,
                        error: `Script exited with code ${code}`,
                        output: errorOutput || output
                    });
                }
            });

            process.on('error', (error) => {
                reject({
                    success: false,
                    error: error.message
                });
            });
        });

    } catch (err) {
        console.error('Error running consolidator:', err);
        return { success: false, error: err.message };
    }
});

console.log('✅ Excel Service initialized');
console.log(`📁 Excel path: ${excelPath}`);