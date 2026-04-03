import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Support both DATABASE_URL (Render/Neon) and individual vars (local dev)
const dbConfig: PoolConfig = process.env['DATABASE_URL']
  ? {
      connectionString: process.env['DATABASE_URL'],
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      database: process.env['DB_NAME'] || 'poshomill',
      user: process.env['DB_USER'] || 'mwei',
      password: process.env['DB_PASSWORD'] || '',
      ssl: process.env['DB_SSL'] === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

// Create connection pool
export const pool = new Pool(dbConfig);

// Set timezone on each connection
pool.on('connect', async (client) => {
  try {
    await client.query("SET timezone = 'Africa/Nairobi'");
  } catch (error) {
    console.error('Failed to set timezone:', error);
  }
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW() as timestamp, current_setting('timezone') as timezone");
    client.release();
    console.log('✅ Database connected successfully:', result.rows[0].timestamp, 'Timezone:', result.rows[0].timezone);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closeDatabase = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

// Health check query
export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
  try {
    const result = await pool.query("SELECT NOW() as timestamp");
    return {
      status: 'healthy',
      timestamp: result.rows[0].timestamp,
    };
  } catch (_error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  }
};