import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, successResponse, errorResponse } from '../middleware/validation';

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password, full_name, role = 'user' } = req.body;

  if (!email || !password || !full_name) {
    errorResponse(res, 'Email, password, and full name are required', 400);
    return;
  }

  if (password.length < 6) {
    errorResponse(res, 'Password must be at least 6 characters', 400);
    return;
  }

  // Check if user already exists
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    errorResponse(res, 'User already exists', 400);
    return;
  }

  // Hash password
  const saltRounds = 12;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // Create user
  const result = await pool.query(
    'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role, created_at',
    [email, password_hash, full_name, role]
  );

  const user = result.rows[0];

  // Generate initial API key for mobile access
  const apiKey = crypto.randomBytes(32).toString('hex');
  const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  await pool.query(
    'INSERT INTO api_keys (user_id, key_name, key_hash, permissions) VALUES ($1, $2, $3, $4)',
    [user.id, 'Default API Key', apiKeyHash, 'read,write']
  );

  // Generate JWT token
  if (!process.env['JWT_SECRET']) {
    errorResponse(res, 'Server configuration error', 500);
    return;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env['JWT_SECRET'],
    { expiresIn: '24h' }
  );

  successResponse(res, {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    },
    token,
    apiKey: apiKey // Only returned on registration
  }, 'User registered successfully', 201);
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    errorResponse(res, 'Email and password are required', 400);
    return;
  }

  // Find user
  const result = await pool.query(
    'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    errorResponse(res, 'Invalid credentials', 401);
    return;
  }

  const user = result.rows[0];

  if (!user.is_active) {
    errorResponse(res, 'Account is deactivated', 401);
    return;
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    errorResponse(res, 'Invalid credentials', 401);
    return;
  }

  // Update last login
  await pool.query(
    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
    [user.id]
  );

  // Generate JWT token
  if (!process.env['JWT_SECRET']) {
    errorResponse(res, 'Server configuration error', 500);
    return;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env['JWT_SECRET'],
    { expiresIn: '24h' }
  );

  successResponse(res, {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    },
    token
  }, 'Login successful');
});

export const refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }

  // Generate new JWT token
  if (!process.env['JWT_SECRET']) {
    errorResponse(res, 'Server configuration error', 500);
    return;
  }

  const token = jwt.sign(
    { userId: req.user.id, email: req.user.email, role: req.user.role },
    process.env['JWT_SECRET'],
    { expiresIn: '24h' }
  );

  successResponse(res, { token }, 'Token refreshed successfully');
});

export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    errorResponse(res, 'Current password and new password are required', 400);
    return;
  }

  if (newPassword.length < 6) {
    errorResponse(res, 'New password must be at least 6 characters', 400);
    return;
  }

  // Get current password hash
  const result = await pool.query(
    'SELECT password_hash FROM users WHERE id = $1',
    [req.user.id]
  );

  const user = result.rows[0];
  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

  if (!isValidPassword) {
    errorResponse(res, 'Current password is incorrect', 400);
    return;
  }

  // Hash new password
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newPasswordHash, req.user.id]
  );

  successResponse(res, null, 'Password changed successfully');
});

export const createAPIKey = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }

  const { key_name, permissions = 'read,write', expires_at } = req.body;

  if (!key_name) {
    errorResponse(res, 'Key name is required', 400);
    return;
  }

  // Generate API key
  const apiKey = crypto.randomBytes(32).toString('hex');
  const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  // Store hashed version
  await pool.query(
    'INSERT INTO api_keys (user_id, key_name, key_hash, permissions, expires_at) VALUES ($1, $2, $3, $4, $5)',
    [req.user.id, key_name, apiKeyHash, permissions, expires_at || null]
  );

  successResponse(res, { apiKey }, 'API key created successfully', 201);
});

export const getAPIKeys = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }

  const result = await pool.query(
    'SELECT id, key_name, permissions, is_active, expires_at, created_at FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );

  successResponse(res, result.rows, 'API keys retrieved successfully');
});

export const revokeAPIKey = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }

  const { keyId } = req.params;

  await pool.query(
    'UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2',
    [keyId, req.user.id]
  );

  successResponse(res, null, 'API key revoked successfully');
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }

  const result = await pool.query(
    'SELECT id, email, full_name, role, is_active, last_login_at, created_at, updated_at FROM users WHERE id = $1',
    [req.user.id]
  );

  successResponse(res, result.rows[0], 'Profile retrieved successfully');
});
