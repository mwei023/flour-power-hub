import { Request, Response } from 'express';
import { pool } from '../config/database';
import { asyncHandler, successResponse, errorResponse, createPaginationResponse } from '../middleware/validation';
import type { CreateTransactionRequest, UpdateTransactionRequest } from '../types';

// Extend Request type to include validatedData
interface ValidatedRequest extends Request {
  validatedData?: {
    body?: CreateTransactionRequest | UpdateTransactionRequest;
  };
}

export const getAllTransactions = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 20;
  const offset = (page - 1) * limit;
  const search = req.query['search'] as string;
  const grainType = req.query['grain_type'] as string;
  const paymentMethod = req.query['payment_method'] as string;
  const status = req.query['status'] as string;
  const startDate = req.query['start_date'] as string;
  const endDate = req.query['end_date'] as string;
  const customerId = req.query['customer_id'] as string;
  
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params: (string | number)[] = [];
  let paramCount = 1;
  
  if (search) {
    query += ` AND (customer_name ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }
  
  if (grainType) {
    // Map frontend grain types to backend types
    const grainMap: Record<string, string> = {
      'maize-1': 'maize',
      'maize-2': 'maize',
      'wheat': 'wheat',
      'wimbi': 'millet',
    };
    const backendGrain = grainMap[grainType] || grainType;
    query += ` AND grain_type = $${paramCount}`;
    params.push(backendGrain);
    paramCount++;
  }
  
  if (paymentMethod) {
    query += ` AND payment_method = $${paramCount}`;
    params.push(paymentMethod);
    paramCount++;
  }
  
  if (status) {
    query += ` AND status = $${paramCount}`;
    params.push(status);
    paramCount++;
  }
  
  if (customerId) {
    query += ` AND customer_id = $${paramCount}`;
    params.push(customerId);
    paramCount++;
  }
  
  if (startDate) {
    query += ` AND created_at >= $${paramCount}`;
    params.push(startDate);
    paramCount++;
  }
  
  if (endDate) {
    query += ` AND created_at <= $${paramCount}`;
    params.push(endDate);
    paramCount++;
  }
  
  // Add pagination
  query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  
  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) FROM transactions WHERE 1=1';
  const countParams: (string | number)[] = [];
  
  // Reuse the same filters for count query
  if (search) {
    countQuery += ` AND (customer_name ILIKE $${countParams.length + 1})`;
    countParams.push(`%${search}%`);
  }
  if (grainType) {
    countQuery += ` AND grain_type = $${countParams.length + 1}`;
    const grainMap: Record<string, string> = {
      'maize-1': 'maize',
      'maize-2': 'maize',
      'wheat': 'wheat',
      'wimbi': 'millet',
    };
    countParams.push(grainMap[grainType] || grainType);
  }
  if (paymentMethod) {
    countQuery += ` AND payment_method = $${countParams.length + 1}`;
    countParams.push(paymentMethod);
  }
  if (status) {
    countQuery += ` AND status = $${countParams.length + 1}`;
    countParams.push(status);
  }
  if (customerId) {
    countQuery += ` AND customer_id = $${countParams.length + 1}`;
    countParams.push(customerId);
  }
  if (startDate) {
    countQuery += ` AND created_at >= $${countParams.length + 1}`;
    countParams.push(startDate);
  }
  if (endDate) {
    countQuery += ` AND created_at <= $${countParams.length + 1}`;
    countParams.push(endDate);
  }
  
  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count);
  
  successResponse(res, createPaginationResponse(result.rows, total, page, limit));
});

export const getTransactionById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
  
  if (result.rows.length === 0) {
    return errorResponse(res, 'Transaction not found', 404);
  }
  
  successResponse(res, result.rows[0]);
});

export const getTodayTransactions = asyncHandler(async (_req: Request, res: Response) => {
  // Use a timezone-aware query to get today's transactions
  // This handles the Africa/Nairobi timezone correctly
  const result = await pool.query(
    `SELECT * FROM transactions 
     WHERE created_at >= CURRENT_DATE AT TIME ZONE 'Africa/Nairobi'
       AND created_at < (CURRENT_DATE + INTERVAL '1 day') AT TIME ZONE 'Africa/Nairobi'
     ORDER BY created_at DESC`
  );
  
  successResponse(res, result.rows);
});

export const createTransaction = asyncHandler(async (req: ValidatedRequest, res: Response) => {
  const validatedData = req.validatedData?.body as CreateTransactionRequest;
  
  if (!validatedData) {
    return errorResponse(res, 'Invalid request data', 400);
  }
  
  const { 
    customer_id, 
    customer_name, 
    grain_type, 
    kilos, 
    milling_count, 
    price_per_kilo, 
    total_price, 
    payment_method, 
    status,
    notes 
  } = validatedData;
  
  // Map frontend grain types to backend types
  const grainMap: Record<string, string> = {
    'maize-1': 'maize',
    'maize-2': 'maize',
    'wheat': 'wheat',
    'wimbi': 'millet',
  };
  const backendGrainType = grainMap[grain_type] || grain_type;
  
  // Generate receipt number
  const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  const result = await pool.query(
    `INSERT INTO transactions 
      (customer_id, customer_name, grain_type, kilos, milling_count, price_per_kilo, total_price, payment_method, status, notes, receipt_number) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
     RETURNING *`,
    [
      customer_id || null, 
      customer_name, 
      backendGrainType, 
      kilos, 
      milling_count, 
      price_per_kilo, 
      total_price, 
      payment_method, 
      status || 'completed', 
      notes || null,
      receiptNumber
    ]
  );
  
  successResponse(res, result.rows[0], 'Transaction created successfully', 201);
});

export const updateTransaction = asyncHandler(async (req: ValidatedRequest, res: Response) => {
  const { id } = req.params;
  const validatedData = req.validatedData?.body as UpdateTransactionRequest;
  
  if (!validatedData) {
    return errorResponse(res, 'Invalid request data', 400);
  }
  
  const fields: string[] = [];
  const values: (string | number)[] = [];
  let paramCount = 1;
  
  // Skip grain_type mapping for updates to avoid type issues
  const { grain_type, ...otherFields } = validatedData;
  
  Object.entries(otherFields).forEach(([key, value]) => {
    if (value !== undefined) {
      // Convert camelCase to snake_case for database
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${snakeKey} = $${paramCount}`);
      values.push(value as string | number);
      paramCount++;
    }
  });
  
  if (fields.length === 0) {
    return errorResponse(res, 'No fields to update', 400);
  }
  
  if (!id) {
    return errorResponse(res, 'Transaction ID is required', 400);
  }
  
  values.push(id);
  const query = `UPDATE transactions SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
  
  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    return errorResponse(res, 'Transaction not found', 404);
  }
  
  successResponse(res, result.rows[0], 'Transaction updated successfully');
});

export const deleteTransaction = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const result = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING *', [id]);
  
  if (result.rows.length === 0) {
    return errorResponse(res, 'Transaction not found', 404);
  }
  
  successResponse(res, null, 'Transaction deleted successfully');
});

// New endpoint: GET /api/v1/transactions/paid-recent
export const getRecentPaidTransactions = asyncHandler(async (req: Request, res: Response) => {
  try {
    const since = req.query['since'] as string;
    
    let query = `
      SELECT id, customer_name, grain_type, kilos, milling_count, 
             price_per_kilo, total_price, payment_method, status, notes, 
             created_at, updated_at
      FROM transactions 
      WHERE status = 'completed' 
        AND created_at > NOW() - INTERVAL '5 minutes'
    `;
    
    if (since) {
      query += ` AND created_at > $1`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT 20`;
    
    const params = since ? [since] : [];
    const result = await pool.query(query, params);
    
    successResponse(res, result.rows);
  } catch (error) {
    console.error('Fetch paid error:', error);
    errorResponse(res, 'Failed to fetch paid transactions', 500);
  }
});

