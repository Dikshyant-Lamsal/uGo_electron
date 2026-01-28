/* eslint-disable prettier/prettier */
/**
 * MIGRATION SCRIPT: Google Sheets → PostgreSQL (with separate cohort tables)
 * 
 * This script:
 * 1. Creates master_database table (equivalent to Master_Database sheet)
 * 2. Creates participations table
 * 3. Migrates data from Google Sheets Master_Database → master_database
 * 4. Migrates data from Google Sheets Participations → participations
 * 5. Creates separate cohort tables (cohort_c1, cohort_c2, etc.)
 * 6. Populates cohort tables with relevant student data
 * 
 * Run this ONCE to migrate your data
 */

import pkg from 'pg';
const { Pool } = pkg;
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURATION
// ============================================

const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, '../config/service-account.json');
const SPREADSHEET_ID = '1PwfwsUsSBYY9FXhGLU8LGqAW8_-tKrmIeTGw3aal784';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getCohortTableName(cohort) {
  return `cohort_${cohort.toLowerCase()}`;
}

// ============================================
// STEP 1: CREATE TABLES
// ============================================

async function createTables() {
  console.log('\n📋 STEP 1: Creating database tables...\n');

  // Master database table (full student data)
  const createMasterTable = `
    CREATE TABLE IF NOT EXISTS master_database (
      id SERIAL PRIMARY KEY,
      student_id VARCHAR(100) UNIQUE NOT NULL,
      full_name VARCHAR(255),
      source_sheet VARCHAR(100),
      cohort VARCHAR(50),
      district VARCHAR(100),
      address TEXT,
      contact_number VARCHAR(50),
      program VARCHAR(255),
      college VARCHAR(255),
      current_year VARCHAR(50),
      program_structure VARCHAR(100),
      scholarship_percentage VARCHAR(50),
      scholarship_starting_year VARCHAR(50),
      scholarship_status VARCHAR(100),
      total_college_fee DECIMAL(12,2) DEFAULT 0,
      total_scholarship_amount DECIMAL(12,2) DEFAULT 0,
      total_due DECIMAL(12,2) DEFAULT 0,
      books_total DECIMAL(12,2) DEFAULT 0,
      uniform_total DECIMAL(12,2) DEFAULT 0,
      books_uniform_total DECIMAL(12,2) DEFAULT 0,
      year_1_fee DECIMAL(12,2) DEFAULT 0,
      year_1_payment DECIMAL(12,2) DEFAULT 0,
      year_2_fee DECIMAL(12,2) DEFAULT 0,
      year_3_fee DECIMAL(12,2) DEFAULT 0,
      year_4_fee DECIMAL(12,2) DEFAULT 0,
      year_1_gpa DECIMAL(4,2),
      participation TEXT,
      last_updated TIMESTAMP DEFAULT NOW(),
      year_2_payment DECIMAL(12,2) DEFAULT 0,
      year_2_gpa DECIMAL(4,2),
      remarks TEXT,
      father_name VARCHAR(255),
      father_contact VARCHAR(50),
      mother_name VARCHAR(255),
      mother_contact VARCHAR(50),
      scholarship_type VARCHAR(100),
      total_amount_paid DECIMAL(12,2) DEFAULT 0,
      year_3_payment DECIMAL(12,2) DEFAULT 0,
      year_4_payment DECIMAL(12,2) DEFAULT 0,
      year_3_gpa DECIMAL(4,2),
      year_4_gpa DECIMAL(4,2),
      overall_status VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createParticipationsTable = `
    CREATE TABLE IF NOT EXISTS participations (
      participation_id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES master_database(id) ON DELETE CASCADE,
      event_name VARCHAR(255),
      event_date DATE,
      event_type VARCHAR(100) DEFAULT 'Workshop',
      role VARCHAR(100) DEFAULT 'Participant',
      hours DECIMAL(6,2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_master_student_id ON master_database(student_id);
    CREATE INDEX IF NOT EXISTS idx_master_cohort ON master_database(cohort);
    CREATE INDEX IF NOT EXISTS idx_master_full_name ON master_database(full_name);
    CREATE INDEX IF NOT EXISTS idx_master_college ON master_database(college);
    CREATE INDEX IF NOT EXISTS idx_master_district ON master_database(district);
    CREATE INDEX IF NOT EXISTS idx_participations_student_id ON participations(student_id);
    CREATE INDEX IF NOT EXISTS idx_participations_event_date ON participations(event_date);
  `;

  try {
    await pool.query(createMasterTable);
    console.log('✅ Created master_database table');

    await pool.query(createParticipationsTable);
    console.log('✅ Created participations table');

    await pool.query(createIndexes);
    console.log('✅ Created indexes');

    console.log('\n✅ All base tables created successfully!\n');
  } catch (err) {
    console.error('❌ Error creating tables:', err);
    throw err;
  }
}

// ============================================
// STEP 2: INITIALIZE GOOGLE SHEETS API
// ============================================

async function initializeGoogleSheets() {
  console.log('📊 Connecting to Google Sheets...\n');

  try {
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    await auth.authorize();
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('✅ Connected to Google Sheets\n');
    return sheets;
  } catch (err) {
    console.error('❌ Error connecting to Google Sheets:', err);
    throw err;
  }
}

// ============================================
// STEP 3: MIGRATE STUDENTS TO MASTER_DATABASE
// ============================================

async function migrateStudents(sheets) {
  console.log('👥 STEP 2: Migrating students to master_database...\n');

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Master_Database!A2:AQ',
    });

    const rows = response.data.values || [];
    console.log(`📊 Found ${rows.length} students to migrate\n`);

    let migrated = 0;
    let errors = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        const parseNumeric = (val) => {
          const num = parseFloat(val);
          return isNaN(num) ? 0 : num;
        };

        await pool.query(`
          INSERT INTO master_database (
            id, student_id, full_name, source_sheet, cohort, district,
            address, contact_number, program, college, current_year,
            program_structure, scholarship_percentage, scholarship_starting_year,
            scholarship_status, total_college_fee, total_scholarship_amount,
            total_due, books_total, uniform_total, books_uniform_total,
            year_1_fee, year_1_payment, year_2_fee, year_3_fee, year_4_fee,
            year_1_gpa, participation, last_updated, year_2_payment,
            year_2_gpa, remarks, father_name, father_contact, mother_name,
            mother_contact, scholarship_type, total_amount_paid,
            year_3_payment, year_4_payment, year_3_gpa, year_4_gpa,
            overall_status
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
            $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38,
            $39, $40, $41, $42, $43
          ) ON CONFLICT (student_id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            last_updated = NOW()
        `, [
          parseInt(row[0]) || i + 1,
          row[1] || `UGO_UNKNOWN_${i}`,
          row[2] || '',
          row[3] || '',
          row[4] || '',
          row[5] || '',
          row[6] || '',
          row[7] || '',
          row[8] || '',
          row[9] || '',
          row[10] || '',
          row[11] || '',
          row[12] || '',
          row[13] || '',
          row[14] || '',
          parseNumeric(row[15]),
          parseNumeric(row[16]),
          parseNumeric(row[17]),
          parseNumeric(row[18]),
          parseNumeric(row[19]),
          parseNumeric(row[20]),
          parseNumeric(row[21]),
          parseNumeric(row[22]),
          parseNumeric(row[23]),
          parseNumeric(row[24]),
          parseNumeric(row[25]),
          parseNumeric(row[26]) || null,
          row[27] || '',
          row[28] || new Date().toISOString(),
          parseNumeric(row[29]),
          parseNumeric(row[30]) || null,
          row[31] || '',
          row[32] || '',
          row[33] || '',
          row[34] || '',
          row[35] || '',
          row[36] || '',
          parseNumeric(row[37]),
          parseNumeric(row[38]),
          parseNumeric(row[39]),
          parseNumeric(row[40]) || null,
          parseNumeric(row[41]) || null,
          row[42] || ''
        ]);

        migrated++;
        
        if (migrated % 50 === 0) {
          console.log(`  ✅ Migrated ${migrated}/${rows.length} students...`);
        }
      } catch (err) {
        errors++;
        console.error(`  ❌ Error migrating row ${i + 1}: ${err.message}`);
      }
    }

    console.log(`\n✅ Students migration to master_database complete!`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Total: ${rows.length}\n`);

    return { migrated, errors, total: rows.length };
  } catch (err) {
    console.error('❌ Error migrating students:', err);
    throw err;
  }
}

// ============================================
// STEP 4: CREATE AND POPULATE COHORT TABLES
// ============================================

async function createCohortTables() {
  console.log('📚 STEP 3: Creating and populating cohort tables...\n');

  try {
    // Get unique cohorts from master_database
    const cohortsResult = await pool.query(`
      SELECT DISTINCT cohort 
      FROM master_database 
      WHERE cohort IS NOT NULL AND cohort != ''
      ORDER BY cohort
    `);

    const cohorts = cohortsResult.rows.map(r => r.cohort);
    console.log(`📊 Found ${cohorts.length} cohorts: ${cohorts.join(', ')}\n`);

    for (const cohort of cohorts) {
      const tableName = getCohortTableName(cohort);
      
      console.log(`  Creating table: ${tableName}...`);

      // Create cohort table
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

      console.log(`  ✅ Created ${tableName}`);

      // Populate cohort table from master_database
      const result = await pool.query(`
        INSERT INTO ${tableName} (
          id, full_name, scholarship_starting_year, current_year, scholarship_type,
          scholarship_percentage, contact_number, district, address, program,
          program_structure, college, scholarship_status, remarks,
          year_1_gpa, year_2_gpa, year_3_gpa, year_4_gpa,
          overall_status, participation, last_updated
        )
        SELECT 
          id, full_name, scholarship_starting_year, current_year, scholarship_type,
          scholarship_percentage, contact_number, district, address, program,
          program_structure, college, scholarship_status, remarks,
          year_1_gpa, year_2_gpa, year_3_gpa, year_4_gpa,
          overall_status, participation, NOW()
        FROM master_database
        WHERE cohort = $1
        ON CONFLICT (id) DO NOTHING
      `, [cohort]);

      console.log(`  ✅ Populated ${tableName} with ${result.rowCount} students\n`);
    }

    console.log('✅ All cohort tables created and populated!\n');
    return { cohortsCreated: cohorts.length };
  } catch (err) {
    console.error('❌ Error creating cohort tables:', err);
    throw err;
  }
}

// ============================================
// STEP 5: MIGRATE PARTICIPATIONS
// ============================================

async function migrateParticipations(sheets) {
  console.log('🎯 STEP 4: Migrating participations...\n');

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Participations!A2:J',
    });

    const rows = response.data.values || [];
    console.log(`📊 Found ${rows.length} participations to migrate\n`);

    let migrated = 0;
    let errors = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        await pool.query(`
          INSERT INTO participations (
            participation_id, student_id, event_name, event_date,
            event_type, role, hours, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (participation_id) DO NOTHING
        `, [
          parseInt(row[0]) || i + 1,
          parseInt(row[1]) || null,
          row[2] || '',
          row[3] || null,
          row[4] || 'Workshop',
          row[5] || 'Participant',
          parseFloat(row[6]) || 0,
          row[7] || '',
          row[8] || new Date().toISOString(),
          row[9] || new Date().toISOString()
        ]);

        migrated++;
        
        if (migrated % 20 === 0) {
          console.log(`  ✅ Migrated ${migrated}/${rows.length} participations...`);
        }
      } catch (err) {
        errors++;
        console.error(`  ❌ Error migrating participation ${i + 1}: ${err.message}`);
      }
    }

    console.log(`\n✅ Participations migration complete!`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Total: ${rows.length}\n`);

    return { migrated, errors, total: rows.length };
  } catch (err) {
    console.error('❌ Error migrating participations:', err);
    throw err;
  }
}

// ============================================
// STEP 6: VERIFY MIGRATION
// ============================================

async function verifyMigration() {
  console.log('🔍 STEP 5: Verifying migration...\n');

  try {
    const studentCount = await pool.query('SELECT COUNT(*) FROM master_database');
    const participationCount = await pool.query('SELECT COUNT(*) FROM participations');
    const cohorts = await pool.query('SELECT DISTINCT cohort FROM master_database WHERE cohort IS NOT NULL ORDER BY cohort');

    console.log('📊 Migration Summary:');
    console.log(`   Total Students: ${studentCount.rows[0].count}`);
    console.log(`   Total Participations: ${participationCount.rows[0].count}`);
    console.log(`   Cohorts Found: ${cohorts.rows.map(r => r.cohort).join(', ')}`);
    console.log('');

    // Verify cohort tables
    console.log('📚 Cohort Tables:');
    for (const cohortRow of cohorts.rows) {
      const cohort = cohortRow.cohort;
      const tableName = getCohortTableName(cohort);
      const count = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
      console.log(`   ${tableName}: ${count.rows[0].count} students`);
    }
    console.log('');

    // Sample data
    const sampleStudents = await pool.query('SELECT id, student_id, full_name, cohort FROM master_database LIMIT 5');
    console.log('📋 Sample Students:');
    sampleStudents.rows.forEach(s => {
      console.log(`   ${s.id}: ${s.full_name} (${s.student_id}) - Cohort ${s.cohort}`);
    });
    console.log('');

  } catch (err) {
    console.error('❌ Error verifying migration:', err);
    throw err;
  }
}

// ============================================
// MAIN MIGRATION FUNCTION
// ============================================

async function runMigration() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 GOOGLE SHEETS → POSTGRESQL MIGRATION (WITH COHORT TABLES)');
  console.log('='.repeat(70) + '\n');

  try {
    // Step 1: Create base tables
    await createTables();

    // Step 2: Connect to Google Sheets
    const sheets = await initializeGoogleSheets();

    // Step 3: Migrate students to master_database
    const studentsResult = await migrateStudents(sheets);

    // Step 4: Create and populate cohort tables
    const cohortsResult = await createCohortTables();

    // Step 5: Migrate participations
    const participationsResult = await migrateParticipations(sheets);

    // Step 6: Verify
    await verifyMigration();

    console.log('='.repeat(70));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log(`\n📊 Final Stats:`);
    console.log(`   Students: ${studentsResult.migrated}/${studentsResult.total}`);
    console.log(`   Cohort Tables: ${cohortsResult.cohortsCreated}`);
    console.log(`   Participations: ${participationsResult.migrated}/${participationsResult.total}`);
    console.log(`   Total Errors: ${studentsResult.errors + participationsResult.errors}\n`);

  } catch (err) {
    console.error('\n❌ MIGRATION FAILED:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration();