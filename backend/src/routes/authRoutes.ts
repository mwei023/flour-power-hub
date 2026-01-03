import express from 'express';
import {
  register,
  login,
  refreshToken,
  changePassword,
  createAPIKey,
  getAPIKeys,
  revokeAPIKey,
  getProfile
} from '../controllers/authController';
import { authenticateJWT, auditLog } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', auditLog('register', 'user'), register);
router.post('/login', auditLog('login', 'user'), login);

// Protected routes
router.post('/refresh-token', authenticateJWT, auditLog('refresh_token', 'user'), refreshToken);
router.post('/change-password', authenticateJWT, auditLog('change_password', 'user'), changePassword);
router.get('/profile', authenticateJWT, auditLog('get_profile', 'user'), getProfile);

// API Key management
router.post('/api-keys', authenticateJWT, auditLog('create_api_key', 'api_key'), createAPIKey);
router.get('/api-keys', authenticateJWT, auditLog('get_api_keys', 'api_key'), getAPIKeys);
router.delete('/api-keys/:keyId', authenticateJWT, auditLog('revoke_api_key', 'api_key'), revokeAPIKey);

export default router;
