/* eslint-disable prettier/prettier */
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixMigration() {
    console.log('🔧 Fixing migration issues...\n');

    try {
        // Step 1: Fix empty cohort values
        console.log('1. Fixing empty cohort values...');
        const updateResult = await pool.query(`
      UPDATE master_database 
      SET cohort = 'C1' 
      WHERE cohort IS NULL OR cohort = ''
    `);
        console.log(`   ✅ Fixed ${updateResult.rowCount} students with empty cohort\n`);

        // Step 2: Drop invalid cohort_ table if it exists
        console.log('2. Cleaning up invalid tables...');
        try {
            await pool.query('DROP TABLE IF EXISTS "cohort_"');
            console.log('   ✅ Dropped invalid cohort_ table\n');
        } catch (err) {
            console.log('   ℹ️  No invalid table to clean\n');
        }

        // Step 3: Get valid cohorts and create missing tables
        console.log('3. Creating missing cohort tables...');
        const cohortsResult = await pool.query(`
      SELECT DISTINCT cohort 
      FROM master_database 
      WHERE cohort IS NOT NULL AND cohort != ''
      ORDER BY cohort
    `);

        const cohorts = cohortsResult.rows.map(r => r.cohort);
        console.log(`   Found cohorts: ${cohorts.join(', ')}\n`);

        for (const cohort of cohorts) {
            const tableName = `cohort_${cohort.toLowerCase()}`;

            // Check if table exists
            const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [tableName]);

            if (!tableExists.rows[0].exists) {
                console.log(`   Creating ${tableName}...`);

                // Create table
                await pool.query(`
          CREATE TABLE ${tableName} (
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
          
          CREATE INDEX idx_${tableName}_full_name ON ${tableName}(full_name);
          CREATE INDEX idx_${tableName}_college ON ${tableName}(college);
        `);

                // Populate table
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

                console.log(`   ✅ Created and populated ${tableName} with ${result.rowCount} students\n`);
            } else {
                console.log(`   ✅ ${tableName} already exists\n`);
            }
        }

        // Step 4: Verify everything
        console.log('4. Verification:\n');
        const studentCount = await pool.query('SELECT COUNT(*) FROM master_database');
        console.log(`   Total Students: ${studentCount.rows[0].count}`);

        for (const cohort of cohorts) {
            const tableName = `cohort_${cohort.toLowerCase()}`;
            const count = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
            console.log(`   ${tableName}: ${count.rows[0].count} students`);
        }

        console.log('\n✅ Migration fixed successfully!\n');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

fixMigration();