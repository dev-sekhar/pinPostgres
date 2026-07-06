const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('TRUNCATE TABLE "AuditLog" CASCADE');
  console.log('Truncated');
  await client.end();
}
run().catch(console.error);
