import { Router } from 'express';
import { 
  registerC2BUrl,
  handleC2BNotification, 
  initiateStkPush,
  checkStkStatus,
  initiateB2CPayment,
  handleB2CResult,
  handleB2CTimeout,
  checkTransactionStatus,
  checkAccountBalance,
  simulateC2B,
  getAllMpesaPayments, 
  getMpesaPaymentById,
  getMpesaSummary 
} from '../controllers/mpesaController';
import { authenticateJWT, auditLog, requireBoss } from '../middleware/auth';

const router = Router();

// ==================== C2B WEBHOOK ====================
// Register C2B URL with Safaricom (call once to set up)
router.post('/register-c2b', authenticateJWT, requireBoss, registerC2BUrl);

// M-Pesa webhook endpoint (public - no auth required, uses Safaricom credentials)
router.post('/webhook', handleC2BNotification);

// ==================== STK PUSH ====================
// Initiate STK Push payment (authenticated)
router.post('/stkpush', authenticateJWT, auditLog('initiate_stk_push', 'mpesa'), initiateStkPush);
// Check STK Push status
router.get('/stkpush/:checkoutRequestId', authenticateJWT, auditLog('check_stk_status', 'mpesa'), checkStkStatus);

// ==================== B2C (REFUNDS) ====================
// Initiate B2C payment (refunds)
router.post('/b2c', authenticateJWT, requireBoss, auditLog('initiate_b2c', 'mpesa'), initiateB2CPayment);
// B2C callbacks (public)
router.post('/b2c/result', handleB2CResult);
router.post('/b2c/timeout', handleB2CTimeout);

// ==================== TRANSACTION STATUS ====================
// Check transaction status
router.get('/status/:transactionId', authenticateJWT, auditLog('check_transaction_status', 'mpesa'), checkTransactionStatus);

// ==================== ACCOUNT BALANCE ====================
// Check account balance
router.get('/balance', authenticateJWT, requireBoss, auditLog('check_account_balance', 'mpesa'), checkAccountBalance);

// ==================== C2B SIMULATION (TESTING) ====================
// Simulate C2B transaction (for testing)
router.post('/simulate', authenticateJWT, requireBoss, auditLog('simulate_c2b', 'mpesa'), simulateC2B);

// ==================== QUERY ENDPOINTS ====================
// Boss-only routes for viewing M-Pesa payments
router.get('/', authenticateJWT, requireBoss, auditLog('get_mpesa_payments', 'mpesa'), getAllMpesaPayments);
router.get('/summary', authenticateJWT, requireBoss, auditLog('get_mpesa_summary', 'mpesa'), getMpesaSummary);
router.get('/:id', authenticateJWT, requireBoss, auditLog('get_mpesa_payment', 'mpesa'), getMpesaPaymentById);

export default router;
