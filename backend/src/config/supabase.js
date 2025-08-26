import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Supabase Client (for auth and realtime features)
export const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'placeholder-key'
);

// PostgreSQL Pool (for direct database access)
export const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : undefined
});

// Database helper functions
export const db = {
  // Simple query
  query: (text, params) => pool.query(text, params),
  
  // Get one row
  getOne: async (text, params) => {
    const result = await pool.query(text, params);
    return result.rows[0] || null;
  },
  
  // Get many rows
  getMany: async (text, params) => {
    const result = await pool.query(text, params);
    return result.rows;
  },
  
  // Transaction support
  transaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};

// Test database connection
export const testConnection = async () => {
  try {
    // Skip database test if no real Supabase URL is configured
    if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      console.log('⚠️  Warning: Supabase not configured. Running in demo mode.');
      console.log('📝 To connect Supabase:');
      console.log('   1. Create a project at https://supabase.com');
      console.log('   2. Update backend/.env with your credentials');
      return true; // Allow server to start without database
    }
    
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    console.log('⚠️  Running without database connection');
    return true; // Allow server to start anyway
  }
};