import { Router } from 'express';
import { z } from 'zod';
import {
  getAllTransactions,
  getTransactionById,
  getTodayTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getRecentPaidTransactions,
} from '../controllers/transactionController';
import { validateRequest } from '../middleware/validation';
import { authenticateJWT, auditLog, requireBoss, requireAttendant } from '../middleware/auth';

const router = Router();

// Validation schemas
const createTransactionSchema = z.object({
  body: z.object({
    customer_id: z.string().uuid().optional(),
    customer_name: z.string().min(1, 'Customer name is required'),
    grain_type: z.enum(['maize-1', 'maize-2', 'wheat', 'wimbi']),
    kilos: z.number().positive('Kilos must be positive').max(10000),
    milling_count: z.union([z.literal(1), z.literal(2)]),
    price_per_kilo: z.number().positive('Price per kilo must be positive'),
    total_price: z.number().positive('Total price must be positive'),
    payment_method: z.enum(['cash', 'mpesa', 'credit']),
    status: z.enum(['completed', 'pending', 'cancelled']).optional(),
    notes: z.string().max(1000).optional(),
  }),
});

const updateTransactionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid transaction ID'),
  }),
  body: z.object({
    customer_id: z.string().uuid().optional(),
    customer_name: z.string().min(1, 'Customer name is required').optional(),
    grain_type: z.enum(['maize-1', 'maize-2', 'wheat', 'wimbi']).optional(),
    kilos: z.number().positive('Kilos must be positive').max(10000).optional(),
    milling_count: z.union([z.literal(1), z.literal(2)]).optional(),
    price_per_kilo: z.number().positive('Price per kilo must be positive').optional(),
    total_price: z.number().positive('Total price must be positive').optional(),
    payment_method: z.enum(['cash', 'mpesa', 'credit']).optional(),
    status: z.enum(['completed', 'pending', 'cancelled']).optional(),
    notes: z.string().max(1000).optional(),
  }),
});

const transactionIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid transaction ID'),
  }),
});

const transactionFiltersSchema = z.object({
  query: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    grain_type: z.enum(['maize-1', 'maize-2', 'wheat', 'wimbi']).optional(),
    payment_method: z.enum(['cash', 'mpesa', 'credit']).optional(),
    customer_id: z.string().uuid().optional(),
    status: z.enum(['completed', 'pending', 'cancelled']).optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort_by: z.string().optional(),
    sort_order: z.enum(['asc', 'desc']).optional(),
  }),
});

// Routes

// IMPORTANT: Specific routes must come BEFORE parameterized routes (:id)
// Otherwise /paid-recent will be matched as :id = "paid-recent"

// Boss and attendant routes - can view today's transactions
router.get('/today', authenticateJWT, auditLog('get_today_transactions', 'transaction'), getTodayTransactions);

// All authenticated users (both boss and attendant) can poll for recent paid transactions
router.get('/paid-recent', authenticateJWT, auditLog('get_recent_paid_transactions', 'transaction'), getRecentPaidTransactions);

// Boss-only routes (boss role required for full history)
router.get('/', authenticateJWT, requireBoss, validateRequest(transactionFiltersSchema), auditLog('get_transactions', 'transaction'), getAllTransactions);
router.get('/:id', authenticateJWT, requireBoss, validateRequest(transactionIdSchema), auditLog('get_transaction', 'transaction'), getTransactionById);
router.put('/:id', authenticateJWT, requireBoss, validateRequest(updateTransactionSchema), auditLog('update_transaction', 'transaction'), updateTransaction);
router.delete('/:id', authenticateJWT, requireBoss, validateRequest(transactionIdSchema), auditLog('delete_transaction', 'transaction'), deleteTransaction);

// All authenticated users can create transactions
router.post('/', authenticateJWT, validateRequest(createTransactionSchema), auditLog('create_transaction', 'transaction'), createTransaction);

export default router;
