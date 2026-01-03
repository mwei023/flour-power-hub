import { Router } from 'express';
import { z } from 'zod';
import {
  getAllTenders,
  getTenderById,
  createTender,
  updateTender,
  deleteTender,
} from '../controllers/tenderController';
import { validateRequest } from '../middleware/validation';
import { authenticateJWT, auditLog } from '../middleware/auth';

const router = Router();

// Validation schemas
const createTenderSchema = z.object({
  body: z.object({
    customer_id: z.string().uuid('Invalid customer ID'),
    customer_name: z.string().min(1, 'Customer name is required'),
    organization: z.string().min(1, 'Organization is required').max(255),
    grain_type: z.enum(['maize-1', 'maize-2', 'wheat', 'wimbi']),
    quantity: z.number().positive('Quantity must be positive').max(100000),
    unit: z.enum(['kg', 'bags']),
    agreed_price: z.number().positive('Agreed price must be positive'),
    status: z.enum(['pending', 'picked-up', 'milled', 'delivered', 'paid']).optional(),
    notes: z.string().max(1000).optional(),
    due_date: z.string().datetime().optional(),
  }),
});

const updateTenderSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid tender ID'),
  }),
  body: z.object({
    customer_id: z.string().uuid().optional(),
    customer_name: z.string().min(1, 'Customer name is required').optional(),
    organization: z.string().min(1, 'Organization is required').max(255).optional(),
    grain_type: z.enum(['maize-1', 'maize-2', 'wheat', 'wimbi']).optional(),
    quantity: z.number().positive('Quantity must be positive').max(100000).optional(),
    unit: z.enum(['kg', 'bags']).optional(),
    agreed_price: z.number().positive('Agreed price must be positive').optional(),
    status: z.enum(['pending', 'picked-up', 'milled', 'delivered', 'paid']).optional(),
    notes: z.string().max(1000).optional(),
    due_date: z.string().datetime().optional(),
  }),
});

const tenderIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid tender ID'),
  }),
});

const tenderFiltersSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'picked-up', 'milled', 'delivered', 'paid']).optional(),
    organization: z.string().optional(),
    customer_id: z.string().uuid().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort_by: z.string().optional(),
    sort_order: z.enum(['asc', 'desc']).optional(),
  }),
});

// Routes
router.get('/', validateRequest(tenderFiltersSchema), getAllTenders);
router.get('/:id', validateRequest(tenderIdSchema), getTenderById);
router.post('/', validateRequest(createTenderSchema), createTender);
router.put('/:id', validateRequest(updateTenderSchema), updateTender);
router.delete('/:id', validateRequest(tenderIdSchema), deleteTender);

export default router;
