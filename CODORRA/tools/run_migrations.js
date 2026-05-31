const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const migrationsDir = path.resolve(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  // Prefer a direct DATABASE_URL if provided (works with local Postgres or remote)
  const databaseUrl = process.env.DATABASE_URL;
  let connectionString;

  if (databaseUrl && databaseUrl.length > 0) {
    connectionString = databaseUrl;
    console.log('Using DATABASE_URL from environment');
  } else {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('DATABASE_URL not set and SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env');
      process.exit(1);
    }

    const host = supabaseUrl.replace(/^https?:\/\//, '').replace(/\/.*/, '');
    connectionString = `postgres://postgres:${encodeURIComponent(serviceKey)}@${host}:5432/postgres`;
    console.log('Constructed Postgres connection using SUPABASE_URL host:', host);
  }

  // connection timeout options help surface network issues quickly
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });

  try {
    await client.connect();
    console.log('Connected to Postgres at', host);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log('Applying', filePath);
      const sql = fs.readFileSync(filePath, 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('Applied', file);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Failed to apply', file, err.message || err);
        throw err;
      }
    }

    console.log('Migrations applied successfully');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
