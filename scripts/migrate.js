const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');

async function runMigration() {
  console.log('Connecting to Supabase PostgreSQL database...');

  // Common Supabase project host formats
  const candidates = [
    'postgresql://postgres.ykqhdpybffwktezvvfyg:Achuwhity19@aws-0-ap-south-1.pooler.supabase.com:6543/postgres',
    'postgresql://postgres.ykqhdpybffwktezvvfyg:Achuwhity19@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
    'postgresql://postgres.ykqhdpybffwktezvvfyg:Achuwhity19@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
    'postgresql://postgres:Achuwhity19@db.ykqhdpybffwktezvvfyg.supabase.co:5432/postgres',
    'postgresql://postgres:Achuwhity19@db.ykqhdpybffwktezvvfyg.supabase.co:6543/postgres',
  ];

  let connected = false;
  for (const connStr of candidates) {
    const endpointLabel = connStr.split('@')[1];
    console.log(`Trying endpoint: ${endpointLabel}...`);
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      await client.connect();
      console.log('✅ Successfully connected to Supabase PostgreSQL database!');
      console.log('⚡ Executing schema.sql migration...');
      await client.query(sql);
      console.log('🎉 Schema migration executed successfully!');

      const res = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
      console.log('Created Tables:');
      res.rows.forEach((r) => console.log('  ✔️ ' + r.table_name));

      const countRes = await client.query('SELECT count(*) FROM public.profiles;');
      console.log(`⭐ Seeded profiles count: ${countRes.rows[0].count}`);

      await client.end();
      connected = true;
      break;
    } catch (err) {
      console.log(`❌ Failed on ${endpointLabel}: ${err.message}`);
      try {
        await client.end();
      } catch {}
    }
  }

  if (!connected) {
    console.error('⚠️ Could not connect via pooler or direct host.');
  }
}

runMigration();
