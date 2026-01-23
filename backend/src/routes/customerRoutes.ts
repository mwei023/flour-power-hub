import { Router } from 'express';
import { z } from 'zod';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCreditCustomers,
  updateCustomerCredit,
} from '../controllers/customerController';
import { validateRequest } from '../middleware/validation';
import { authenticateJWT, auditLog } from '../middleware/auth';
import { ipRateLimit } from '../middleware/security';

const router = Router();

// Validation schemas
const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(255),
    phone: z.string().max(20, 'Phone must be less than 20 characters').optional(),
    type: z.enum(['walk-in', 'credit', 'tender']),
  }),
});

const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID'),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(255).optional(),
    phone: z.string().max(20, 'Phone must be less than 20 characters').optional(),
    type: z.enum(['walk-in', 'credit', 'tender']).optional(),
    credit_balance: z.number().min(0, 'Credit balance cannot be negative').optional(),
  }),
});

const customerIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID'),
  }),
});

// Routes
router.get('/', authenticateJWT, auditLog('get_customers', 'customer'), getAllCustomers);
router.get('/credit', authenticateJWT, auditLog('get_credit_customers', 'customer'), getCreditCustomers);
router.get('/:id', authenticateJWT, validateRequest(customerIdSchema), auditLog('get_customer', 'customer'), getCustomerById);
router.post('/', authenticateJWT, validateRequest(createCustomerSchema), auditLog('create_customer', 'customer'), createCustomer);
router.post('/:id/credit', authenticateJWT, auditLog('update_customer_credit', 'customer'), updateCustomerCredit);
router.put('/:id', authenticateJWT, validateRequest(updateCustomerSchema), auditLog('update_customer', 'customer'), updateCustomer);
router.delete('/:id', authenticateJWT, validateRequest(customerIdSchema), auditLog('delete_customer', 'customer'), deleteCustomer);

export default router;
