// Knex configuration for migrations
import { Knex } from 'knex';
import dotenv from 'dotenv';
dotenv.config();

const config: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    database: process.env['DB_NAME'] || 'poshomill',
    user: process.env['DB_USER'] || 'mwei',
    password: process.env['DB_PASSWORD'] || '',
    ssl: { rejectUnauthorized: false },
  },
  pool: {
    min: 0,
    max: 2,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 30000,
  },
  migrations: {
    directory: './database/migrations',
    tableName: 'knex_migrations',
    extension: 'ts',
    schemaName: 'public',
  },
  seeds: {
    directory: './database/seeds',
    extension: 'ts',
  },
  acquireConnectionTimeout: 30000,
  asyncStackTraces: process.env['NODE_ENV'] === 'development',
};

export default config;
