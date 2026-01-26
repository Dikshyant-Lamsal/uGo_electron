/* eslint-disable prettier/prettier */
// src/renderer/src/api/studentApi.js
/**
 * Student API Service
 * Wrapper around Electron IPC calls for cleaner component code
 */

class StudentAPI {
    /**
     * Get all students with optional filters
     * @param {Object} params - { page, limit, search, filters }
     * @returns {Promise<{success: boolean, data: Array, pagination: Object}>}
     */
    async getStudents(params = {}) {
        try {
            const result = await globalThis.api.excel.getStudents(params);
            return result;
        } catch (error) {
            console.error('Error fetching students:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get single student by ID
     * @param {number} id - Student ID
     * @returns {Promise<{success: boolean, data: Object}>}
     */
    async getStudent(id) {
        try {
            const result = await globalThis.api.excel.getStudent(id);
            return result;
        } catch (error) {
            console.error('Error fetching student:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Add new student
     * @param {Object} studentData - Student information
     * @returns {Promise<{success: boolean, data: Object, message: string}>}
     */
    async addStudent(studentData) {
        try {
            const result = await globalThis.api.excel.addStudent(studentData);
            return result;
        } catch (error) {
            console.error('Error adding student:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update student
     * @param {number} id - Student ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<{success: boolean, data: Object, message: string}>}
     */
    async updateStudent(id, updates) {
        try {
            const result = await window.api.excel.updateStudent(id, updates);
            return result;
        } catch (error) {
            console.error('Error updating student:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete student
     * @param {number} id - Student ID
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async deleteStudent(id) {
        try {
            const result = await window.api.excel.deleteStudent(id);
            return result;
        } catch (error) {
            console.error('Error deleting student:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get dashboard statistics
     * @returns {Promise<{success: boolean, stats: Object, fileInfo: Object}>}
     */
    async getStats() {
        try {
            const result = await globalThis.api.excel.getStats();
            return result;
        } catch (error) {
            console.error('Error fetching stats:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Refresh data from Excel file
     * @returns {Promise<{success: boolean, message: string, stats: Object}>}
     */
    async refresh() {
        try {
            const result = await window.api.excel.refresh();
            return result;
        } catch (error) {
            console.error('Error refreshing data:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all sheets
     * @returns {Promise<{success: boolean, sheets: Array}>}
     */
    async getSheets() {
        try {
            const result = await window.api.excel.getSheets();
            return result;
        } catch (error) {
            console.error('Error fetching sheets:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get data from specific sheet
     * @param {Object} params - { sheetName, page, limit, search }
     * @returns {Promise<{success: boolean, data: Array, pagination: Object}>}
     */
    async getSheetData(params) {
        try {
            const result = await window.api.excel.getSheetData(params);
            return result;
        } catch (error) {
            console.error('Error fetching sheet data:', error);
            return { success: false, error: error.message };
        }
    }

    /**
 * Save student photo
 * @param {number} id - Student ID
 * @param {File} file - Photo file
 * @returns {Promise<{success: boolean, message: string}>}
 */
    async savePhoto(id, file) {
        try {
            // Read file as base64
            const reader = new FileReader();

            return new Promise((resolve, reject) => {
                reader.onload = async () => {
                    const base64Data = reader.result.split(',')[1]; // Remove data:image/jpeg;base64,
                    const extension = file.name.split('.').pop().toLowerCase();

                    const result = await globalThis.api.photos.savePhoto({
                        id,
                        photoData: base64Data,
                        extension
                    });

                    resolve(result);
                };

                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsDataURL(file);
            });
        } catch (error) {
            console.error('Error saving photo:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if photo exists for student
     * @param {number} id - Student ID
     */
    async photoExists(id) {
        try {
            const result = await globalThis.api.photos.photoExists(id);
            return result;
        } catch (error) {
            console.error('Error checking photo:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get photo path for student
     * @param {number} id - Student ID
     */
    async getPhotoPath(id) {
        try {
            const result = await globalThis.api.photos.getPhotoPath(id);
            return result;
        } catch (error) {
            console.error('Error getting photo path:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete student photo
     * @param {number} id - Student ID
     */
    async deletePhoto(id) {
        try {
            const result = await window.api.photos.deletePhoto(id);
            return result;
        } catch (error) {
            console.error('Error deleting photo:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // PARTICIPATION OPERATIONS
    // ============================================

    /**
     * Get all participations for a student
     * @param {number} studentId - Student ID
     * @returns {Promise<{success: boolean, data: Array}>}
     */
    async getParticipations(studentId) {
        try {
            const result = await window.api.excel.getParticipations(studentId);
            return result;
        } catch (error) {
            console.error('Error fetching participations:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    /**
     * Get single participation by ID
     * @param {number} id - Participation ID
     * @returns {Promise<{success: boolean, data: Object}>}
     */
    async getParticipation(id) {
        try {
            const result = await window.api.excel.getParticipation(id);
            return result;
        } catch (error) {
            console.error('Error fetching participation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Add new participation
     * @param {Object} participationData - Participation information
     * @returns {Promise<{success: boolean, data: Object, message: string}>}
     */
    async addParticipation(participationData) {
        try {
            const result = await window.api.excel.addParticipation(participationData);
            return result;
        } catch (error) {
            console.error('Error adding participation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update participation
     * @param {number} id - Participation ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<{success: boolean, data: Object, message: string}>}
     */
    async updateParticipation(id, updates) {
        try {
            const result = await window.api.excel.updateParticipation(id, updates);
            return result;
        } catch (error) {
            console.error('Error updating participation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete participation
     * @param {number} id - Participation ID
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async deleteParticipation(id) {
        try {
            const result = await window.api.excel.deleteParticipation(id);
            return result;
        } catch (error) {
            console.error('Error deleting participation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all participations (for reports)
     * @param {Object} params - Query parameters
     * @returns {Promise<{success: boolean, data: Array}>}
     */
    async getAllParticipations(params = {}) {
        try {
            const result = await window.api.excel.getAllParticipations(params);
            return result;
        } catch (error) {
            console.error('Error fetching all participations:', error);
            return { success: false, error: error.message };
        }
    }
    /**
 * Import students from Excel file
 * @param {string} filePath - Path to Excel file
 * @param {string} sourceSheet - Source cohort name
 */
    async importFile(filePath, sourceSheet) {
        try {
            const result = await window.api.excel.importFile({ filePath, sourceSheet });
            return result;
        } catch (error) {
            console.error('Error importing file:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // PDF OPERATIONS
    // ============================================

    /**
     * Save student profile as PDF
     * @param {string} htmlContent - Full HTML string
     * @param {string} defaultFileName - Default file name
     * @returns {Promise<{success: boolean, filePath?: string, canceled?: boolean, error?: string}>}
     */
    async saveStudentPDF(htmlContent, defaultFileName = 'student-profile.pdf') {
        try {
            const result = await window.api.pdf.save(htmlContent, defaultFileName);
            return result;
        } catch (error) {
            console.error('Error saving PDF:', error);
            return { success: false, error: error.message };
        }
    }

    /**
 * Get list of available cohorts
 * @returns {Promise<{success: boolean, cohorts: Array}>}
 */
    async getCohorts() {
        try {
            const result = await window.api.excel.getCohorts();
            return result;
        } catch (error) {
            console.error('Error fetching cohorts:', error);
            return { success: false, error: error.message, cohorts: [] };
        }
    }

    /**
     * Add a new cohort sheet
     * @param {string} cohortName - Cohort name (e.g., C4, C5)
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async addCohort(cohortName) {
        try {
            const result = await window.api.excel.addCohort(cohortName);
            return result;
        } catch (error) {
            console.error('Error adding cohort:', error);
            return { success: false, error: error.message };
        }
    }

        /**
     * Run Python consolidator script
     */
    async runConsolidator() {
        try {
            const result = await window.api.excel.runConsolidator();
            return result;
        } catch (error) {
            console.error('Error running consolidator:', error);
            return { success: false, error: error.message };
        }
    }
}


// Export singleton instance
export default new StudentAPI();