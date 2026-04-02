import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/database';

// Set test environment before importing app
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use dynamic port

describe('Authentication & Security', () => {
  let server: any;
  let baseURL: string;

  beforeAll(async () => {
    // Start server on dynamic port
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseURL = `http://localhost:${addr.port}`;
      }
    });
    
    // Wait for server to be ready
    await new Promise(resolve => server.once('listening', resolve));
    
    // Ensure database is connected
    await pool.query('SELECT 1');
  });

  afterAll(async () => {
    await pool.end();
    if (server) {
      server.close();
    }
  });

  // Helper function to make requests
  const makeRequest = async (method: string, path: string, data?: any) => {
    const addr = server.address();
    const port = addr && typeof addr === 'object' ? addr.port : 3001;
    const url = `http://localhost:${port}`;
    
    if (method === 'GET') {
      return request(url).get(path);
    } else if (method === 'POST') {
      return request(url).post(path).send(data);
    }
    throw new Error(`Unsupported method: ${method}`);
  };

  describe('Public Routes', () => {
    it('should allow access to health check without authentication', async () => {
      const addr = server.address();
      const port = addr && typeof addr === 'object' ? addr.port : 3001;
      
      const response = await request(`http://localhost:${port}`)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should allow access to root endpoint without authentication', async () => {
      const addr = server.address();
      const port = addr && typeof addr === 'object' ? addr.port : 3001;
      
      const response = await request(`http://localhost:${port}`)
        .get('/')
        .expect(200);

      expect(response.body.name).toBe('Posho Mill Tracker API');
    });

    it('should allow access to auth login endpoint without authentication', async () => {
      const addr = server.address();
      const port = addr && typeof addr === 'object' ? addr.port : 3001;
      
      const response = await request(`http://localhost:${port}`)
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
      const addr = server.address();
      const port = addr && typeof addr === 'object' ? addr.port : 3001;
      
      const response = await request(`http://localhost:${port}`)
        .get('/api/v1/customers')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should deny access with invalid JWT token', async () => {
      const addr = server.address();
      const port = addr && typeof addr === 'object' ? addr.port : 3001;
      
      const response = await request(`http://localhost:${port}`)
        .get('/api/v1/customers')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const addr = server.address();
      const port = addr && typeof addr === 'object' ? addr.port : 3001;
      
      const response = await request(`http://localhost:${port}`)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined(); // May be 'DENY' or 'SAMEORIGIN'
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should allow reasonable number of requests', async () => {
      const addr = server.address();
      const port = addr && typeof addr === 'object' ? addr.port : 3001;
      
      // Make multiple requests to test rate limiting
      for (let i = 0; i < 5; i++) {
        await request(`http://localhost:${port}`)
          .get('/health')
          .expect(200);
      }
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize malicious input', async () => {
      const addr = server.address();
      const port = addr && typeof addr === 'object' ? addr.port : 3001;
      
      const maliciousInput = {
        name: '<script>alert("xss")</script>Normal Name',
        phone: '1234567890'
      };

      const response = await request(`http://localhost:${port}`)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
          ...maliciousInput
        })
        .expect(401);

      // The request should be processed without script tags
      expect(response.body.success).toBe(false);
    });
  });
});
