import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connStr = process.env.DATABASE_URL_EXTERNAL || process.env.DATABASE_URL;
if (!connStr) {
  console.error('Database URL not set. Define DATABASE_URL_EXTERNAL (local) or DATABASE_URL (Railway internal).');
  process.exit(1);
}

const pool = new Pool({
  connectionString: connStr,
  ssl: connStr.includes('railway.app') || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(`PostgreSQL Connected: ${client.connectionParameters.host}`);
    client.release();
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export const query = (text, params) => pool.query(text, params);

export const getClient = () => pool.connect();

export default pool;
