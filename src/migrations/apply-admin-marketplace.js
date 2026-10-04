import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const statements = [
  `CREATE TABLE IF NOT EXISTS districts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    state text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS district_services (
    district_id uuid NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(district_id, service_id)
  )`,
  'ALTER TABLE business_services ADD COLUMN IF NOT EXISTS district_id uuid',
  'CREATE INDEX IF NOT EXISTS business_services_district_id_idx ON business_services(district_id)',
  'CREATE INDEX IF NOT EXISTS district_services_service_id_idx ON district_services(service_id)',
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'business_services_district_id_fkey') THEN
      ALTER TABLE business_services ADD CONSTRAINT business_services_district_id_fkey
        FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL;
    END IF;
  END $$`,
  `INSERT INTO districts (name, state)
    SELECT DISTINCT COALESCE(NULLIF(TRIM(bs.district), ''), NULLIF(TRIM(bp.city), '')),
      COALESCE(NULLIF(TRIM(bp.state), ''), 'Unknown')
    FROM business_services bs JOIN business_profiles bp ON bp.id = bs.business_id
    WHERE COALESCE(NULLIF(TRIM(bs.district), ''), NULLIF(TRIM(bp.city), '')) IS NOT NULL
    ON CONFLICT (name) DO NOTHING`,
  `UPDATE business_services bs SET district_id = d.id
    FROM districts d
    WHERE bs.district_id IS NULL AND LOWER(TRIM(d.name)) = LOWER(TRIM(bs.district))`,
  `INSERT INTO district_services (district_id, service_id)
    SELECT DISTINCT district_id, service_id FROM business_services
    WHERE district_id IS NOT NULL ON CONFLICT (district_id, service_id) DO NOTHING`,
];

try {
  for (const statement of statements) await pool.query(statement);
  console.log('Admin marketplace migration applied');
} finally {
  await pool.end();
}
