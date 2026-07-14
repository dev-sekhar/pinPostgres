import { PgBoss } from 'pg-boss';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for pg-boss");
}

const boss = new PgBoss(process.env.DATABASE_URL);

boss.on('error', error => console.error('pg-boss error:', error));

export const initBoss = async () => {
  await boss.start();
  console.log('pg-boss started successfully');
};

export default boss;
