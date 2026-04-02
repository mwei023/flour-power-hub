import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env['NODE_ENV'] = 'test';
  process.env['DB_HOST'] = process.env['DB_HOST'] || 'localhost';
  process.env['DB_PORT'] = process.env['DB_PORT'] || '5432';
  process.env['DB_NAME'] = process.env['DB_NAME'] || 'poshomill_test';
  process.env['DB_USER'] = process.env['DB_USER'] || 'postgres';
  process.env['DB_PASSWORD'] = process.env['DB_PASSWORD'] || '';
  process.env['JWT_SECRET'] = process.env['JWT_SECRET'] || 'test-jwt-secret';

  console.log('🔧 Setting up test environment...');
});

// Global test teardown
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
});

// Mock console.log in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Extend Jest matchers
expect.extend({
  toBeValidDate(received: unknown) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      };
    }
  },
});

// Helper function to create test user
export const createTestUser = () => ({
  id: 1,
  email: 'test@example.com',
  password: 'hashedpassword',
  role: 'admin',
  created_at: new Date(),
  updated_at: new Date(),
});

// Helper function to create test customer
export const createTestCustomer = () => ({
  id: 1,
  name: 'Test Customer',
  email: 'customer@example.com',
  phone: '+1234567890',
  address: '123 Test St, Test City, TC 12345',
  created_at: new Date(),
  updated_at: new Date(),
});

// Helper function to create test transaction
export const createTestTransaction = () => ({
  id: 1,
  customer_id: 1,
  type: 'sale',
  amount: 100.00,
  status: 'completed',
  description: 'Test transaction',
  created_at: new Date(),
  updated_at: new Date(),
});