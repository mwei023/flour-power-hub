import { Router } from 'express';
import { z } from 'zod';
import {
  getDailySummary,
  getDateRangeSummary,
  exportDailyReport,
} from '../controllers/reportController';
import { validateRequest } from '../middleware/validation';
import { authenticateJWT, auditLog } from '../middleware/auth';

const router = Router();

// Validation schemas
const dailySummarySchema = z.object({
  query: z.object({
    date: z.string().optional(),
  }),
});

const dateRangeSummarySchema = z.object({
  query: z.object({
    start_date: z.string(),
    end_date: z.string(),
  }),
});

const exportReportSchema = z.object({
  query: z.object({
    start_date: z.string(),
    end_date: z.string(),
    format: z.enum(['csv', 'json']).optional(),
  }),
});

// Routes
router.get('/daily', authenticateJWT, validateRequest(dailySummarySchema), auditLog('get_daily_summary', 'report'), getDailySummary);
router.get('/date-range', authenticateJWT, validateRequest(dateRangeSummarySchema), auditLog('get_date_range_summary', 'report'), getDateRangeSummary);
router.get('/export', authenticateJWT, validateRequest(exportReportSchema), auditLog('export_daily_report', 'report'), exportDailyReport);

export default router;
