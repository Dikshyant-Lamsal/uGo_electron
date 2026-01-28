/* eslint-disable prettier/prettier */
import pkg from 'pg'
const { Pool } = pkg
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
})

async function fixSequence() {
  const client = await pool.connect()

  try {
    console.log('🔧 Fixing database sequence...')

    // Get current max ID
    const maxResult = await client.query('SELECT MAX(id) as max_id FROM master_database')
    const maxId = maxResult.rows[0].max_id || 0

    console.log(`📊 Current max ID in database: ${maxId}`)

    // Reset the sequence
    const seqResult = await client.query(
      `
      SELECT setval(
        pg_get_serial_sequence('master_database', 'id'),
        $1,
        true
      )
    `,
      [maxId]
    )

    console.log(`✅ Sequence reset to: ${seqResult.rows[0].setval}`)

    // Verify
    const verifyResult = await client.query(`
      SELECT nextval(pg_get_serial_sequence('master_database', 'id')) as next_id
    `)

    console.log(`🔍 Next ID will be: ${verifyResult.rows[0].next_id}`)
    console.log('✅ Sequence fixed successfully!')
  } catch (err) {
    console.error('❌ Error fixing sequence:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

fixSequence()
