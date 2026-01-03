import { Router } from 'express';
import { z } from 'zod';
import {
  getAllExpenses,
  getExpenseById,
  getTodayExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController';
import { validateRequest } from '../middleware/validation';
import { authenticateJWT, auditLog } from '../middleware/auth';

const router = Router();

// Validation schemas
const createExpenseSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive').max(1000000),
    reason: z.string().min(1, 'Reason is required').max(255),
    category: z.enum(['food', 'repairs', 'electricity', 'supplies', 'other']),
  }),
});

const updateExpenseSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid expense ID'),
  }),
  body: z.object({
    amount: z.number().positive('Amount must be positive').max(1000000).optional(),
    reason: z.string().min(1, 'Reason is required').max(255).optional(),
    category: z.enum(['food', 'repairs', 'electricity', 'supplies', 'other']).optional(),
  }),
});

const expenseIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid expense ID'),
  }),
});

const expenseFiltersSchema = z.object({
  query: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    category: z.enum(['food', 'repairs', 'electricity', 'supplies', 'other']).optional(),
    min_amount: z.string().optional(),
    max_amount: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort_by: z.string().optional(),
    sort_order: z.enum(['asc', 'desc']).optional(),
  }),
});

// Routes
router.get('/', validateRequest(expenseFiltersSchema), getAllExpenses);
router.get('/today', getTodayExpenses);
router.get('/:id', validateRequest(expenseIdSchema), getExpenseById);
router.post('/', validateRequest(createExpenseSchema), createExpense);
router.put('/:id', validateRequest(updateExpenseSchema), updateExpense);
router.delete('/:id', validateRequest(expenseIdSchema), deleteExpense);

export default router;
