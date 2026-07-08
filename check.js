require('dotenv').config({path: '.env'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT email, \"deletedAt\", \"tenantId\" FROM \"User\" WHERE email = 'test@admin.com'")
  .then(res => console.log('User details:', res.rows))
  .catch(console.error)
  .finally(() => pool.end());
