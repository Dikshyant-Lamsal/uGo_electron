/* eslint-disable prettier/prettier */
// Database Service - PostgreSQL with separate cohort tables
import { ipcMain, dialog } from 'electron';
import pkg from 'pg';
const { Pool } = pkg;
import XLSX from 'xlsx';
import dotenv from 'dotenv';

// ============================================
// LOAD ENVIRONMENT VARIABLES FIRST
// ============================================
dotenv.config();

// ============================================
// CONFIGURATION
// ============================================

console.log('🔍 DATABASE_URL check:', {
  exists: !!process.env.DATABASE_URL,
  length: process.env.DATABASE_URL?.length,
  preview: process.env.DATABASE_URL?.substring(0, 30) + '...'
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected successfully');
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert database row (snake_case) to frontend format (Pascal_Case)
 */
function rowToStudent(row) {
  return {
    id: row.id,
    Student_ID: row.student_id,
    Full_Name: row.full_name,
    Source_Sheet: row.source_sheet,
    Cohort: row.cohort,
    District: row.district,
    Address: row.address,
    Contact_Number: row.contact_number,
    Program: row.program,
    College: row.college,
    Current_Year: row.current_year,
    Program_Structure: row.program_structure,
    Scholarship_Percentage: row.scholarship_percentage,
    Scholarship_Starting_Year: row.scholarship_starting_year,
    Scholarship_Status: row.scholarship_status,
    Total_College_Fee: row.total_college_fee,
    Total_Scholarship_Amount: row.total_scholarship_amount,
    Total_Due: row.total_due,
    Books_Total: row.books_total,
    Uniform_Total: row.uniform_total,
    Books_Uniform_Total: row.books_uniform_total,
    Year_1_Fee: row.year_1_fee,
    Year_1_Payment: row.year_1_payment,
    Year_2_Fee: row.year_2_fee,
    Year_3_Fee: row.year_3_fee,
    Year_4_Fee: row.year_4_fee,
    Year_1_GPA: row.year_1_gpa,
    Participation: row.participation,
    Last_Updated: row.last_updated,
    Year_2_Payment: row.year_2_payment,
    Year_2_GPA: row.year_2_gpa,
    Remarks: row.remarks,
    Father_Name: row.father_name,
    Father_Contact: row.father_contact,
    Mother_Name: row.mother_name,
    Mother_Contact: row.mother_contact,
    Scholarship_Type: row.scholarship_type,
    Total_Amount_Paid: row.total_amount_paid,
    Year_3_Payment: row.year_3_payment,
    Year_4_Payment: row.year_4_payment,
    Year_3_GPA: row.year_3_gpa,
    Year_4_GPA: row.year_4_gpa,
    Overall_Status: row.overall_status,
    Photo_URL: row.photo_url
  };
}

/**
 * Get cohort table name (e.g., "C1" -> "cohort_c1")
 */
function getCohortTableName(cohort) {
  return `cohort_${cohort.toLowerCase()}`;
}

/**
 * Check if cohort table exists
 */
async function cohortTableExists(cohort) {
  const tableName = getCohortTableName(cohort);
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    )
  `, [tableName]);
  return result.rows[0].exists;
}

/**
 * Create a new cohort table (simplified schema matching Google Sheets cohort structure)
 */
async function createCohortTable(cohort) {
  const tableName = getCohortTableName(cohort);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id INTEGER PRIMARY KEY REFERENCES master_database(id) ON DELETE CASCADE,
      full_name VARCHAR(255),
      scholarship_starting_year VARCHAR(50),
      current_year VARCHAR(50),
      scholarship_type VARCHAR(100),
      scholarship_percentage VARCHAR(50),
      contact_number VARCHAR(50),
      district VARCHAR(100),
      address TEXT,
      program VARCHAR(255),
      program_structure VARCHAR(100),
      college VARCHAR(255),
      scholarship_status VARCHAR(100),
      remarks TEXT,
      year_1_gpa DECIMAL(4,2),
      year_2_gpa DECIMAL(4,2),
      year_3_gpa DECIMAL(4,2),
      year_4_gpa DECIMAL(4,2),
      overall_status VARCHAR(100),
      participation TEXT,
      last_updated TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_${tableName}_full_name ON ${tableName}(full_name);
    CREATE INDEX IF NOT EXISTS idx_${tableName}_college ON ${tableName}(college);
  `);

  console.log(`✅ Created cohort table: ${tableName}`);
}

/**
 * Insert/Update student in cohort table
 */
async function updateCohortTable(student, client) {
  const cohort = student.Cohort || student.cohort;
  if (!cohort) return;

  const tableName = getCohortTableName(cohort);

  // Check if table exists, create if not
  const exists = await cohortTableExists(cohort);
  if (!exists) {
    await createCohortTable(cohort);
  }

  // Use the client if provided (for transaction), otherwise use pool
  const queryExecutor = client || pool;

  // Upsert into cohort table
  await queryExecutor.query(`
    INSERT INTO ${tableName} (
      id, full_name, scholarship_starting_year, current_year, scholarship_type,
      scholarship_percentage, contact_number, district, address, program,
      program_structure, college, scholarship_status, remarks,
      year_1_gpa, year_2_gpa, year_3_gpa, year_4_gpa,
      overall_status, participation, last_updated
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      scholarship_starting_year = EXCLUDED.scholarship_starting_year,
      current_year = EXCLUDED.current_year,
      scholarship_type = EXCLUDED.scholarship_type,
      scholarship_percentage = EXCLUDED.scholarship_percentage,
      contact_number = EXCLUDED.contact_number,
      district = EXCLUDED.district,
      address = EXCLUDED.address,
      program = EXCLUDED.program,
      program_structure = EXCLUDED.program_structure,
      college = EXCLUDED.college,
      scholarship_status = EXCLUDED.scholarship_status,
      remarks = EXCLUDED.remarks,
      year_1_gpa = EXCLUDED.year_1_gpa,
      year_2_gpa = EXCLUDED.year_2_gpa,
      year_3_gpa = EXCLUDED.year_3_gpa,
      year_4_gpa = EXCLUDED.year_4_gpa,
      overall_status = EXCLUDED.overall_status,
      participation = EXCLUDED.participation,
      last_updated = NOW()
  `, [
    student.id,
    student.Full_Name || student.full_name || '',
    student.Scholarship_Starting_Year || student.scholarship_starting_year || '',
    student.Current_Year || student.current_year || '',
    student.Scholarship_Type || student.scholarship_type || '',
    student.Scholarship_Percentage || student.scholarship_percentage || '',
    student.Contact_Number || student.contact_number || '',
    student.District || student.district || '',
    student.Address || student.address || '',
    student.Program || student.program || '',
    student.Program_Structure || student.program_structure || '',
    student.College || student.college || '',
    student.Scholarship_Status || student.scholarship_status || '',
    student.Remarks || student.remarks || '',
    student.Year_1_GPA || student.year_1_gpa || null,
    student.Year_2_GPA || student.year_2_gpa || null,
    student.Year_3_GPA || student.year_3_gpa || null,
    student.Year_4_GPA || student.year_4_gpa || null,
    student.Overall_Status || student.overall_status || '',
    student.Participation || student.participation || ''
  ]);

  console.log(`✅ Updated cohort table ${tableName} for student ${student.id}`);
}

/**
 * Delete student from cohort table
 */
async function deleteFromCohortTable(studentId, cohort) {
  if (!cohort) return;

  const tableName = getCohortTableName(cohort);
  const exists = await cohortTableExists(cohort);

  if (exists) {
    await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [studentId]);
    console.log(`✅ Deleted student ${studentId} from cohort table ${tableName}`);
  }
}

/**
 * Move student from one cohort table to another
 */
async function moveBetweenCohortTables(studentId, oldCohort, newCohort, studentData, client) {
  // Delete from old cohort table
  if (oldCohort) {
    await deleteFromCohortTable(studentId, oldCohort);
  }

  // Add to new cohort table
  if (newCohort) {
    await updateCohortTable(studentData, client);
  }

  console.log(`✅ Moved student ${studentId} from ${oldCohort} to ${newCohort}`);
}

/**
 * Sync the ID sequence to prevent duplicate key errors
 */
async function syncIdSequence(client) {
  try {
    await client.query(`
      SELECT setval(
        pg_get_serial_sequence('master_database', 'id'),
        COALESCE((SELECT MAX(id) FROM master_database), 0) + 1,
        false
      )
    `);
    console.log('✅ ID sequence synced');
  } catch (err) {
    console.error('⚠️ Failed to sync ID sequence:', err.message);
  }
}

/**
 * Get the next global serial number for student IDs
 */
async function getNextStudentSerial(client) {
  const maxIdResult = await client.query(`
    SELECT student_id 
    FROM master_database 
    WHERE student_id ~ '^UGO_C[0-9]+_[0-9]+$'
    ORDER BY 
      CAST(substring(student_id from 'UGO_C[0-9]+_([0-9]+)$') AS INTEGER) DESC 
    LIMIT 1
  `);

  let nextSerial = 1;
  if (maxIdResult.rows.length > 0) {
    const lastId = maxIdResult.rows[0].student_id;
    const match = lastId.match(/UGO_C\d+_(\d+)$/);
    if (match) {
      nextSerial = parseInt(match[1], 10) + 1;
    }
  }

  return nextSerial;
}

// ============================================
// IPC HANDLERS - STUDENTS
// ============================================

ipcMain.handle('excel:getStudents', async (event, params = {}) => {
  try {
    const { page = 1, limit = 100, search = '', filters = {} } = params;

    let query = 'SELECT * FROM master_database WHERE 1=1';
    const values = [];
    let paramCount = 1;

    // Search
    if (search) {
      query += ` AND (
        full_name ILIKE $${paramCount} OR 
        college ILIKE $${paramCount} OR 
        program ILIKE $${paramCount} OR 
        district ILIKE $${paramCount} OR
        student_id ILIKE $${paramCount}
      )`;
      values.push(`%${search}%`);
      paramCount++;
    }

    // Filters
    for (const [key, value] of Object.entries(filters)) {
      if (value && value !== 'All') {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        query += ` AND ${snakeKey} = $${paramCount}`;
        values.push(value);
        paramCount++;
      }
    }

    // Count total
    const countResult = await pool.query(
      query.replace('SELECT *', 'SELECT COUNT(*)'),
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Pagination
    query += ` ORDER BY id DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, (page - 1) * limit);

    const result = await pool.query(query, values);
    const students = result.rows.map(rowToStudent);

    return {
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (err) {
    console.error('Error getting students:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('excel:getStudent', async (event, id) => {
  try {
    const result = await pool.query('SELECT * FROM master_database WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return { success: false, error: `Student with ID ${id} not found` };
    }

    return { success: true, data: rowToStudent(result.rows[0]) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('excel:addStudent', async (event, studentData) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Sync the ID sequence to prevent conflicts
    await syncIdSequence(client);

    const cohort = studentData.Cohort || studentData.Source_Sheet || 'C1';

    // Get the next global serial number
    const nextSerial = await getNextStudentSerial(client);
    const studentId = `UGO_${cohort}_${String(nextSerial).padStart(3, '0')}`;
    
    console.log(`🆔 Generated student ID: ${studentId} (serial: ${nextSerial})`);

    // Insert into master_database
    const result = await client.query(`
      INSERT INTO master_database (
        student_id, full_name, source_sheet, cohort, district, address,
        contact_number, program, college, current_year, program_structure,
        scholarship_percentage, scholarship_starting_year, scholarship_status,
        total_college_fee, total_scholarship_amount, total_due, books_total,
        uniform_total, books_uniform_total, year_1_fee, year_1_payment,
        year_2_fee, year_3_fee, year_4_fee, year_1_gpa, participation,
        year_2_payment, year_2_gpa, remarks, father_name, father_contact,
        mother_name, mother_contact, scholarship_type, total_amount_paid,
        year_3_payment, year_4_payment, year_3_gpa, year_4_gpa, overall_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
        $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41
      ) RETURNING *
    `, [
      studentId,
      studentData.Full_Name || '',
      `ACC ${cohort}, ${cohort}, Database`,
      cohort,
      studentData.District || '',
      studentData.Address || '',
      studentData.Contact_Number || '',
      studentData.Program || '',
      studentData.College || '',
      studentData.Current_Year || '',
      studentData.Program_Structure || '',
      studentData.Scholarship_Percentage || '',
      studentData.Scholarship_Starting_Year || '',
      studentData.Scholarship_Status || '',
      parseFloat(studentData.Total_College_Fee) || 0,
      parseFloat(studentData.Total_Scholarship_Amount) || 0,
      parseFloat(studentData.Total_Due) || 0,
      parseFloat(studentData.Books_Total) || 0,
      parseFloat(studentData.Uniform_Total) || 0,
      parseFloat(studentData.Books_Uniform_Total) || 0,
      parseFloat(studentData.Year_1_Fee) || 0,
      parseFloat(studentData.Year_1_Payment) || 0,
      parseFloat(studentData.Year_2_Fee) || 0,
      parseFloat(studentData.Year_3_Fee) || 0,
      parseFloat(studentData.Year_4_Fee) || 0,
      parseFloat(studentData.Year_1_GPA) || null,
      studentData.Participation || '',
      parseFloat(studentData.Year_2_Payment) || 0,
      parseFloat(studentData.Year_2_GPA) || null,
      studentData.Remarks || '',
      studentData.Father_Name || '',
      studentData.Father_Contact || '',
      studentData.Mother_Name || '',
      studentData.Mother_Contact || '',
      studentData.Scholarship_Type || '',
      parseFloat(studentData.Total_Amount_Paid) || 0,
      parseFloat(studentData.Year_3_Payment) || 0,
      parseFloat(studentData.Year_4_Payment) || 0,
      parseFloat(studentData.Year_3_GPA) || null,
      parseFloat(studentData.Year_4_GPA) || null,
      studentData.Overall_Status || ''
    ]);

    const newStudent = rowToStudent(result.rows[0]);

    // Also insert into cohort table (within same transaction)
    await updateCohortTable(newStudent, client);

    await client.query('COMMIT');

    console.log(`✅ Added student: ${newStudent.Full_Name} (ID: ${newStudent.Student_ID})`);

    return {
      success: true,
      data: newStudent,
      message: `Student "${newStudent.Full_Name}" added successfully`
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error adding student:', err);
    return { success: false, error: err.message };
  } finally {
    client.release();
  }
});

ipcMain.handle('excel:updateStudent', async (event, { id, updates }) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get old student data
    const oldStudentResult = await client.query('SELECT * FROM master_database WHERE id = $1', [id]);
    if (oldStudentResult.rows.length === 0) {
      return { success: false, error: `Student with ID ${id} not found` };
    }
    const oldStudent = rowToStudent(oldStudentResult.rows[0]);
    const oldCohort = oldStudent.Cohort;

    // Build update query for master_database
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      Full_Name: 'full_name',
      Cohort: 'cohort',
      District: 'district',
      Address: 'address',
      Contact_Number: 'contact_number',
      Program: 'program',
      College: 'college',
      Current_Year: 'current_year',
      Program_Structure: 'program_structure',
      Scholarship_Percentage: 'scholarship_percentage',
      Scholarship_Starting_Year: 'scholarship_starting_year',
      Scholarship_Status: 'scholarship_status',
      Total_College_Fee: 'total_college_fee',
      Total_Scholarship_Amount: 'total_scholarship_amount',
      Total_Due: 'total_due',
      Books_Total: 'books_total',
      Uniform_Total: 'uniform_total',
      Year_1_Fee: 'year_1_fee',
      Year_1_Payment: 'year_1_payment',
      Year_1_GPA: 'year_1_gpa',
      Year_2_Payment: 'year_2_payment',
      Year_2_GPA: 'year_2_gpa',
      Year_3_Payment: 'year_3_payment',
      Year_3_GPA: 'year_3_gpa',
      Year_4_Payment: 'year_4_payment',
      Year_4_GPA: 'year_4_gpa',
      Remarks: 'remarks',
      Father_Name: 'father_name',
      Father_Contact: 'father_contact',
      Mother_Name: 'mother_name',
      Mother_Contact: 'mother_contact',
      Scholarship_Type: 'scholarship_type',
      Total_Amount_Paid: 'total_amount_paid',
      Overall_Status: 'overall_status',
      Participation: 'participation'
    };

    // List of numeric fields that need special handling
    const numericFields = [
      'Total_College_Fee', 'Total_Scholarship_Amount', 'Total_Due',
      'Books_Total', 'Uniform_Total', 'Year_1_Fee', 'Year_1_Payment',
      'Year_2_Fee', 'Year_2_Payment', 'Year_3_Fee', 'Year_3_Payment',
      'Year_4_Fee', 'Year_4_Payment', 'Total_Amount_Paid',
      'Year_1_GPA', 'Year_2_GPA', 'Year_3_GPA', 'Year_4_GPA'
    ];

    for (const [key, value] of Object.entries(updates)) {
      const dbKey = fieldMap[key] || key.toLowerCase();

      // Handle numeric fields - convert empty strings to null or 0
      if (numericFields.includes(key)) {
        if (value === '' || value === null || value === undefined) {
          // For GPA fields, use null; for others use 0
          const processedValue = key.includes('GPA') ? null : 0;
          setClauses.push(`${dbKey} = $${paramCount}`);
          values.push(processedValue);
        } else {
          setClauses.push(`${dbKey} = $${paramCount}`);
          values.push(parseFloat(value) || 0);
        }
      } else {
        // For non-numeric fields, use value as-is
        setClauses.push(`${dbKey} = $${paramCount}`);
        values.push(value);
      }

      paramCount++;
    }

    setClauses.push(`last_updated = NOW()`);
    values.push(id);

    // Update master_database
    const result = await client.query(`
      UPDATE master_database 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    const updatedStudent = rowToStudent(result.rows[0]);
    const newCohort = updatedStudent.Cohort;

    // Handle cohort table updates
    if (oldCohort === newCohort) {
      // Same cohort - just update
      await updateCohortTable(updatedStudent, client);
    } else {
      // Cohort changed - move between tables
      await moveBetweenCohortTables(id, oldCohort, newCohort, updatedStudent, client);
    }

    await client.query('COMMIT');

    console.log(`✅ Updated student: ${updatedStudent.Full_Name}`);

    return {
      success: true,
      data: updatedStudent,
      message: `Student "${updatedStudent.Full_Name}" updated successfully`
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating student:', err);
    return { success: false, error: err.message };
  } finally {
    client.release();
  }
});


ipcMain.handle('excel:deleteStudent', async (event, id) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get student data first (for cohort info)
    const studentResult = await client.query('SELECT * FROM master_database WHERE id = $1', [id]);
    if (studentResult.rows.length === 0) {
      return { success: false, error: `Student with ID ${id} not found` };
    }

    const student = rowToStudent(studentResult.rows[0]);
    const cohort = student.Cohort;

    // Delete from cohort table first
    await deleteFromCohortTable(id, cohort);

    // Delete from master_database (cascade will handle participations)
    await client.query('DELETE FROM master_database WHERE id = $1', [id]);

    await client.query('COMMIT');

    console.log(`✅ Deleted student: ${student.Full_Name} (ID: ${id})`);

    return {
      success: true,
      message: `Student "${student.Full_Name}" deleted successfully`
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting student:', err);
    return { success: false, error: err.message };
  } finally {
    client.release();
  }
});

ipcMain.handle('excel:getStats', async () => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_students,
        COUNT(DISTINCT cohort) as total_cohorts,
        COUNT(DISTINCT college) as total_colleges,
        SUM(total_college_fee) as total_fees,
        SUM(total_scholarship_amount) as total_scholarship,
        SUM(total_amount_paid) as total_paid,
        SUM(total_due) as total_due
      FROM master_database
    `);

    const byDistrict = await pool.query(`
      SELECT district, COUNT(*) as count 
      FROM master_database 
      WHERE district IS NOT NULL AND district != ''
      GROUP BY district
    `);

    const byCohort = await pool.query(`
      SELECT cohort, COUNT(*) as count 
      FROM master_database 
      WHERE cohort IS NOT NULL AND cohort != ''
      GROUP BY cohort
      ORDER BY cohort
    `);

    const byCollege = await pool.query(`
      SELECT college, COUNT(*) as count 
      FROM master_database 
      WHERE college IS NOT NULL AND college != ''
      GROUP BY college
      ORDER BY count DESC
      LIMIT 10
    `);

    return {
      success: true,
      stats: {
        totalStudents: parseInt(stats.rows[0].total_students),
        byDistrict: Object.fromEntries(byDistrict.rows.map(r => [r.district, parseInt(r.count)])),
        byCohort: Object.fromEntries(byCohort.rows.map(r => [r.cohort, parseInt(r.count)])),
        byCollege: Object.fromEntries(byCollege.rows.map(r => [r.college, parseInt(r.count)])),
        financialSummary: {
          totalFees: parseFloat(stats.rows[0].total_fees) || 0,
          totalScholarship: parseFloat(stats.rows[0].total_scholarship) || 0,
          totalPaid: parseFloat(stats.rows[0].total_paid) || 0,
          totalDue: parseFloat(stats.rows[0].total_due) || 0,
        }
      },
      fileInfo: {
        lastModified: new Date().toISOString(),
        totalStudents: parseInt(stats.rows[0].total_students),
        source: 'PostgreSQL'
      }
    };
  } catch (err) {
    console.error('Error getting stats:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('excel:refresh', async () => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM master_database');
    return {
      success: true,
      message: 'Data refreshed successfully',
      stats: { totalStudents: parseInt(result.rows[0].count) }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('excel:getCohorts', async () => {
  try {
    // Get all tables that match the cohort pattern (cohort_c1, cohort_c2, etc.)
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'cohort_c%'
      ORDER BY table_name
    `);

    // Extract cohort names from table names (cohort_c1 -> C1)
    const cohortTables = tablesResult.rows
      .map(row => {
        // Extract "c1" from "cohort_c1" and convert to "C1"
        const match = row.table_name.match(/cohort_c(\d+)/);
        return match ? `C${match[1]}` : null;
      })
      .filter(Boolean); // Remove nulls

    // Also get cohorts that have students (for fallback)
    const studentCohortsResult = await pool.query(`
      SELECT DISTINCT cohort 
      FROM master_database 
      WHERE cohort IS NOT NULL AND cohort != ''
      ORDER BY cohort
    `);

    const studentCohorts = studentCohortsResult.rows.map(r => r.cohort);

    // Combine both lists and remove duplicates
    const allCohorts = [...new Set([...cohortTables, ...studentCohorts])];

    // Sort cohorts (C1, C2, C3, C10, C11, etc.)
    allCohorts.sort((a, b) => {
      const numA = parseInt(a.substring(1));
      const numB = parseInt(b.substring(1));
      return numA - numB;
    });

    return {
      success: true,
      cohorts: allCohorts.length > 0 ? allCohorts : ['C1']
    };
  } catch (err) {
    console.error('Error getting cohorts:', err);
    return { success: false, error: err.message, cohorts: ['C1'] };
  }
});

ipcMain.handle('excel:addCohort', async (event, cohortName) => {
  try {
    if (!/^C\d+$/.test(cohortName)) {
      return {
        success: false,
        error: 'Invalid cohort name. Must be in format C1, C2, C3, etc.'
      };
    }

    // Check if cohort table already exists
    const exists = await cohortTableExists(cohortName);
    if (exists) {
      return {
        success: false,
        error: `Cohort table ${cohortName} already exists. You can select it from the dropdown.`
      };
    }

    // Create new cohort table
    await createCohortTable(cohortName);

    console.log(`✅ Created cohort: ${cohortName}`);

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

// ============================================
// IPC HANDLERS - PARTICIPATIONS
// ============================================

ipcMain.handle('excel:getParticipations', async (event, studentId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM participations WHERE student_id = $1 ORDER BY event_date DESC',
      [studentId]
    );

    const participations = result.rows.map(row => ({
      participation_id: row.participation_id,
      student_id: row.student_id,
      event_name: row.event_name,
      event_date: row.event_date,
      event_type: row.event_type,
      role: row.role,
      hours: row.hours,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    return { success: true, data: participations };
  } catch (err) {
    return { success: false, error: err.message, data: [] };
  }
});

ipcMain.handle('excel:addParticipation', async (event, participationData) => {
  try {
    const result = await pool.query(`
      INSERT INTO participations (
        student_id, event_name, event_date, event_type, role, hours, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      participationData.student_id,
      participationData.event_name || '',
      participationData.event_date || null,
      participationData.event_type || 'Workshop',
      participationData.role || 'Participant',
      parseFloat(participationData.hours) || 0,
      participationData.notes || ''
    ]);

    return {
      success: true,
      data: result.rows[0],
      message: 'Participation added successfully'
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('excel:updateParticipation', async (event, { id, updates }) => {
  try {
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(`
      UPDATE participations 
      SET ${setClauses.join(', ')}
      WHERE participation_id = $${paramCount}
      RETURNING *
    `, values);

    return {
      success: true,
      data: result.rows[0],
      message: 'Participation updated successfully'
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('excel:deleteParticipation', async (event, id) => {
  try {
    await pool.query('DELETE FROM participations WHERE participation_id = $1', [id]);
    return { success: true, message: 'Participation deleted successfully' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('excel:getAllParticipations', async (event, params = {}) => {
  try {
    const result = await pool.query('SELECT * FROM participations ORDER BY event_date DESC');
    return {
      success: true,
      data: result.rows,
      pagination: { page: 1, limit: 1000, total: result.rows.length, totalPages: 1 }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ============================================
// IMPORT HANDLER
// ============================================

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

ipcMain.handle('excel:importFile', async (event, { filePath, sourceSheet }) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Sync the ID sequence to prevent conflicts
    await syncIdSequence(client);

    console.log('📥 Importing from:', filePath);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const importedData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    console.log(`📊 Found ${importedData.length} students to import`);

    // Get the next global serial number
    let nextSerial = await getNextStudentSerial(client);

    console.log(`🔢 Starting from serial number: ${nextSerial}`);

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < importedData.length; i++) {
      const student = importedData[i];

      try {
        const fullName = student['Full Name'] || student.Full_Name || student.full_name || '';

        // Skip if no name
        if (!fullName.trim()) {
          console.log(`⏭️ Skipping row ${i + 1}: No name`);
          skipped++;
          continue;
        }

        // Check if student already exists by name and cohort
        const existingStudent = await client.query(
          'SELECT id FROM master_database WHERE full_name = $1 AND cohort = $2',
          [fullName.trim(), sourceSheet]
        );

        if (existingStudent.rows.length > 0) {
          console.log(`⏭️ Skipping duplicate: ${fullName} in ${sourceSheet}`);
          skipped++;
          continue;
        }

        // Generate student ID with global serial counter
        const studentId = `UGO_${sourceSheet}_${String(nextSerial).padStart(3, '0')}`;
        nextSerial++; // Increment for next student

        // Helper functions
        const parseNumeric = (value) => {
          if (value === '' || value === null || value === undefined) return 0;
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 0 : parsed;
        };

        const parseGPA = (value) => {
          if (value === '' || value === null || value === undefined) return null;
          const parsed = parseFloat(value);
          return isNaN(parsed) ? null : parsed;
        };

        const getString = (value) => {
          return value ? String(value).trim() : '';
        };

        // Insert into master_database (auto-generates id)
        const result = await client.query(`
          INSERT INTO master_database (
            student_id, full_name, source_sheet, cohort, district, address,
            contact_number, program, college, current_year, program_structure,
            scholarship_percentage, scholarship_starting_year, scholarship_status,
            total_college_fee, total_scholarship_amount, total_due, books_total,
            uniform_total, books_uniform_total, year_1_fee, year_1_payment,
            year_2_fee, year_3_fee, year_4_fee, year_1_gpa, participation,
            year_2_payment, year_2_gpa, remarks, father_name, father_contact,
            mother_name, mother_contact, scholarship_type, total_amount_paid,
            year_3_payment, year_4_payment, year_3_gpa, year_4_gpa, overall_status
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
            $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41
          ) RETURNING *
        `, [
          studentId,
          fullName.trim(),
          `ACC ${sourceSheet}, ${sourceSheet}, Database`,
          sourceSheet,
          getString(student.District || student.district),
          getString(student.Address || student.address),
          getString(student['Contact Number'] || student.Contact_Number || student.contact_number),
          getString(student.Program || student.program),
          getString(student.College || student.college),
          getString(student['Current Year'] || student.Current_Year || student.current_year),
          getString(student['Program Structure'] || student.Program_Structure || student.program_structure),
          getString(student['Scholarship %'] || student['Scholarship Percentage'] || student.Scholarship_Percentage || student.scholarship_percentage),
          getString(student['Scholarship Starting Year'] || student.Scholarship_Starting_Year || student.scholarship_starting_year),
          getString(student['Scholarship Status'] || student.Scholarship_Status || student.scholarship_status),
          parseNumeric(student['Total College Fee'] || student.Total_College_Fee || student.total_college_fee),
          parseNumeric(student['Total Scholarship Amount'] || student.Total_Scholarship_Amount || student.total_scholarship_amount),
          parseNumeric(student['Total Due'] || student.Total_Due || student.total_due),
          parseNumeric(student['Books Total'] || student.Books_Total || student.books_total),
          parseNumeric(student['Uniform Total'] || student.Uniform_Total || student.uniform_total),
          parseNumeric(student['Books Uniform Total'] || student.Books_Uniform_Total || student.books_uniform_total),
          parseNumeric(student['Year 1 Fee'] || student.Year_1_Fee || student.year_1_fee),
          parseNumeric(student['Year 1 Payment'] || student.Year_1_Payment || student.year_1_payment),
          parseNumeric(student['Year 2 Fee'] || student.Year_2_Fee || student.year_2_fee),
          parseNumeric(student['Year 3 Fee'] || student.Year_3_Fee || student.year_3_fee),
          parseNumeric(student['Year 4 Fee'] || student.Year_4_Fee || student.year_4_fee),
          parseGPA(student['Year 1 GPA'] || student.Year_1_GPA || student.year_1_gpa),
          getString(student.Participation || student.participation),
          parseNumeric(student['Year 2 Payment'] || student.Year_2_Payment || student.year_2_payment),
          parseGPA(student['Year 2 GPA'] || student.Year_2_GPA || student.year_2_gpa),
          getString(student.Remarks || student.remarks),
          getString(student["Father's Name"] || student.Father_Name || student.father_name),
          getString(student["Father's Contact"] || student.Father_Contact || student.father_contact),
          getString(student["Mother's Name"] || student.Mother_Name || student.mother_name),
          getString(student["Mother's Contact"] || student.Mother_Contact || student.mother_contact),
          getString(student['Scholarship Type'] || student.Scholarship_Type || student.scholarship_type),
          parseNumeric(student['Total Amount Paid'] || student.Total_Amount_Paid || student.total_amount_paid),
          parseNumeric(student['Year 3 Payment'] || student.Year_3_Payment || student.year_3_payment),
          parseNumeric(student['Year 4 Payment'] || student.Year_4_Payment || student.year_4_payment),
          parseGPA(student['Year 3 GPA'] || student.Year_3_GPA || student.year_3_gpa),
          parseGPA(student['Year 4 GPA'] || student.Year_4_GPA || student.year_4_gpa),
          getString(student['Overall Status'] || student.Overall_Status || student.overall_status)
        ]);

        // Convert to frontend format and insert into cohort table
        const newStudent = rowToStudent(result.rows[0]);
        await updateCohortTable(newStudent, client);

        imported++;
        console.log(`✅ Imported: ${fullName} (${studentId})`);

      } catch (err) {
        console.error(`❌ Error importing row ${i + 1}:`, err.message);
        errors.push(`Row ${i + 1}: ${err.message}`);
        // Continue with next student instead of failing entire import
        continue;
      }
    }

    await client.query('COMMIT');

    console.log(`✅ Import complete: ${imported} imported, ${skipped} skipped, ${errors.length} errors`);

    return {
      success: true,
      message: `Successfully imported ${imported} students${skipped > 0 ? ` (${skipped} duplicates skipped)` : ''}`,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      total: importedData.length
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Import failed:', err);
    return {
      success: false,
      error: err.message,
      imported: 0,
      total: 0
    };
  } finally {
    client.release();
  }
});

console.log('✅ Database Service initialized (PostgreSQL with cohort tables)');

export { pool };