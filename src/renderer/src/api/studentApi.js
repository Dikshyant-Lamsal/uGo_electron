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
            const result = await window.api.excel.getStudents(params);
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
            const result = await window.api.excel.getStudent(id);
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
            const result = await window.api.excel.addStudent(studentData);
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
            const result = await window.api.excel.getStats();
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
}

// Export singleton instance
export default new StudentAPI();