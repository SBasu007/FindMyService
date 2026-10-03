import pg from 'pg';
import { config } from './env.config.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected database error on idle client:', err);
});

export const testDbConnection = async () => {
  if (!config.databaseUrl) {
    console.warn('⚠️  DATABASE_URL is not set in environment variables.');
    return;
  }

  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as current_time');
    client.release();
    console.log('✅ Database connected successfully at:', res.rows[0].current_time);
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
  }
};

export const query = (text, params) => pool.query(text, params);

export default pool;
