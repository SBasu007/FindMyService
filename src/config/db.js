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

export async function ensureBusinessSchema() {
  const statements = [
    `ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS owner_user_id uuid`,
    `ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS slug text`,
    `ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS instagram_url text`,
    `ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS facebook_url text`,
    `ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS gallery_urls text[] DEFAULT '{}'`,
    `ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS reviews jsonb DEFAULT '[]'::jsonb`,
    `CREATE UNIQUE INDEX IF NOT EXISTS business_profiles_owner_user_id_key ON business_profiles (owner_user_id)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS business_profiles_slug_key ON business_profiles (slug)`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'business_profiles_owner_user_id_fkey') THEN
        ALTER TABLE business_profiles
          ADD CONSTRAINT business_profiles_owner_user_id_fkey
          FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END $$`,
  ];
  for (const statement of statements) await pool.query(statement);
}

export default pool;
