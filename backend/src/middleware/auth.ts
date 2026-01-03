import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../config/database';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    full_name: string;
  };
  apiKey?: {
    id: string;
    user_id: string;
    permissions: string;
  };
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface AuditLogDetails {
  method: string;
  url: string;
  body?: unknown;
  statusCode: number;
}

// JWT Token validation
export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    const token = authHeader.substring(7);
    
    if (!process.env['JWT_SECRET']) {
      console.error('❌ JWT_SECRET not configured');
      res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
      return;
    }

    const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as JWTPayload;
    
    // Verify user still exists and is active
    const userResult = await pool.query(
      'SELECT id, email, role, full_name, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      res.status(401).json({
        success: false,
        error: 'Invalid or inactive user'
      });
      return;
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('❌ JWT Authentication error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }
};

// API Key authentication for mobile apps
export const authenticateAPIKey = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: 'API key required'
      });
      return;
    }

    // Hash the API key for comparison
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    const result = await pool.query(
      `SELECT ak.id, ak.user_id, ak.permissions, u.is_active 
       FROM api_keys ak 
       JOIN users u ON ak.user_id = u.id 
       WHERE ak.key_hash = $1 AND ak.is_active = true AND u.is_active = true`,
      [hashedKey]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
      return;
    }

    req.apiKey = result.rows[0];
    next();
  } catch (error) {
    console.error('❌ API Key authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Map 'admin' to 'boss' for backward compatibility
    const userRole = req.user.role === 'admin' ? 'boss' : req.user.role;

    if (!roles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

// Boss-only authorization middleware (boss role, also accepts admin for backward compatibility)
export const requireBoss = requireRole(['boss']);

// Attendant-only authorization middleware (attendant role)
export const requireAttendant = requireRole(['attendant']);

// Optional authentication (for public endpoints that benefit from user context)
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (process.env['JWT_SECRET']) {
        const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as JWTPayload;
        
        const userResult = await pool.query(
          'SELECT id, email, role, full_name FROM users WHERE id = $1 AND is_active = true',
          [decoded.userId]
        );

        if (userResult.rows.length > 0) {
          req.user = userResult.rows[0];
        }
      }
    }
    
    next();
  } catch (error) {
    // Don't fail on optional auth errors, just continue without user
    next();
  }
};

// Audit logging middleware
export const auditLog = (action: string, resourceType?: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const originalSend = res.send;
    
    res.send = function (data: string | Buffer) {
      // Log the action after response is sent
      if (req.user && process.env['ENABLE_AUDIT_LOGGING'] === 'true') {
        const ip = req.ip || req.connection.remoteAddress || '';
        const userAgent = req.get('User-Agent') || '';
        
        const auditDetails: AuditLogDetails = {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode
        };
        
        if (req.method !== 'GET') {
          auditDetails.body = req.body;
        }
        
        // Async audit log (don't block response)
        pool.query(
          `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            req.user!.id,
            action,
            resourceType || null,
            req.params['id'] || null,
            JSON.stringify(auditDetails),
            ip,
            userAgent
          ]
        ).catch(error => {
          console.error('❌ Audit log error:', error);
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};
