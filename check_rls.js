require('dotenv').config({path: '.env'});
const { Pool } = require('pg');
// Use APP_DATABASE_URL to simulate what prisma does
const pool = new Pool({ connectionString: process.env.APP_DATABASE_URL });
(async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
    const res = await client.query('SELECT email FROM "User" WHERE email = $1', ['test@admin.com']);
    console.log("Users with bypass_rls:", res.rows);
    await client.query("COMMIT");
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
})();
