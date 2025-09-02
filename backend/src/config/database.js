import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Railway PostgreSQL接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL_EXTERNAL || 'postgresql://postgres:DNqaDqFjyphTNKTtazhhsJyRDFrPtNWz@maglev.proxy.rlwy.net:49323/railway',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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