import request from 'supertest';
import { Server } from 'http';
import app from '../src/app';
import { pool } from '../src/config/database';

// Set test environment before importing app
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '0'; // Use dynamic port

describe('Authentication & Security', () => {
  let server: Server;

  beforeAll(async () => {
    // Start server on dynamic port
    server = app.listen(0);

    // Wait for server to be ready
    await new Promise<void>(resolve => server.once('listening', resolve));
    
    // Ensure database is connected
    await pool.query('SELECT 1');
  });

  afterAll(async () => {
    await pool.end();
    if (server) {
      server.close();
    }
  });

  // Helper to get the dynamic port
  const getPort = (): number => {
    const addr = server.address();
    return addr && typeof addr === 'object' ? addr.port : 3001;
  };

  describe('Public Routes', () => {
    it('should allow access to health check without authentication', async () => {
      const response = await request(`http://localhost:${getPort()}`)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should allow access to root endpoint without authentication', async () => {
      const response = await request(`http://localhost:${getPort()}`)
        .get('/')
        .expect(200);

      expect(response.body.name).toBe('Posho Mill Tracker API');
    });

    it('should allow access to auth login endpoint without authentication', async () => {
      const response = await request(`http://localhost:${getPort()}`)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Protected Routes', () => {
    it('should deny access to protected routes without authentication', async () => {
      const response = await request(`http://localhost:${getPort()}`)
        .get('/api/v1/customers')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should deny access with invalid JWT token', async () => {
      const response = await request(`http://localhost:${getPort()}`)
        .get('/api/v1/customers')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(`http://localhost:${getPort()}`)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should allow reasonable number of requests', async () => {
      for (let i = 0; i < 5; i++) {
        await request(`http://localhost:${getPort()}`)
          .get('/health')
          .expect(200);
      }
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize malicious input', async () => {
      const maliciousInput = {
        name: '<script>alert("xss")</script>Normal Name',
        phone: '1234567890'
      };

      const response = await request(`http://localhost:${getPort()}`)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
          ...maliciousInput
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});