import { Request, Response } from 'express';
import { pool } from '../config/database';
import { asyncHandler, successResponse, errorResponse, createPaginationResponse } from '../middleware/validation';
import type { CreateTenderRequest, UpdateTenderRequest } from '../types';

// Extend Request type to include validatedData
interface ValidatedRequest extends Request {
  validatedData?: {
    body?: CreateTenderRequest | UpdateTenderRequest;
  };
}

export const getAllTenders = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 20;
  const offset = (page - 1) * limit;
  const search = req.query['search'] as string;
  const status = req.query['status'] as string;
  const grainType = req.query['grain_type'] as string;
  
  let query = 'SELECT * FROM tenders WHERE 1=1';
  const params: (string | number | null)[] = [];
  let paramCount = 1;
  
  if (search) {
    query += ` AND (customer_name ILIKE $${paramCount} OR organization ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }
  
  if (status) {
    query += ` AND status = $${paramCount}`;
    params.push(status);
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
  
  // Add pagination
  query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  
  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) FROM tenders WHERE 1=1';
  const countParams: (string | number | null)[] = [];
  
  if (search) {
    countQuery += ` AND (customer_name ILIKE $${countParams.length + 1} OR organization ILIKE $${countParams.length + 1})`;
    countParams.push(`%${search}%`);
  }
  if (status) {
    countQuery += ` AND status = $${countParams.length + 1}`;
    countParams.push(status);
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
  
  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count);
  
  successResponse(res, createPaginationResponse(result.rows, total, page, limit));
});

export const getTenderById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const result = await pool.query('SELECT * FROM tenders WHERE id = $1', [id]);
  
  if (result.rows.length === 0) {
    return errorResponse(res, 'Tender not found', 404);
  }
  
  successResponse(res, result.rows[0]);
});

export const createTender = asyncHandler(async (req: ValidatedRequest, res: Response) => {
  const validatedData = req.validatedData?.body as CreateTenderRequest;
  
  if (!validatedData) {
    return errorResponse(res, 'Invalid request data', 400);
  }
  
  const { 
    customer_id, 
    customer_name, 
    organization, 
    grain_type, 
    quantity, 
    unit, 
    agreed_price, 
    status,
    notes,
    due_date 
  } = validatedData;
  
  // Map frontend grain types to backend types
  const grainMap: Record<string, string> = {
    'maize-1': 'maize',
    'maize-2': 'maize',
    'wheat': 'wheat',
    'wimbi': 'millet',
  };
  const backendGrainType = grainMap[grain_type] || grain_type;
  
  const result = await pool.query(
    `INSERT INTO tenders 
      (customer_id, customer_name, organization, grain_type, quantity, unit, agreed_price, status, notes, due_date) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
     RETURNING *`,
    [
      customer_id || null, 
      customer_name, 
      organization, 
      backendGrainType, 
      quantity, 
      unit || 'kg', 
      agreed_price || null, 
      status || 'pending', 
      notes || null,
      due_date || null
    ]
  );
  
  successResponse(res, result.rows[0], 'Tender created successfully', 201);
});

export const updateTender = asyncHandler(async (req: ValidatedRequest, res: Response) => {
  const { id } = req.params;
  const validatedData = req.validatedData?.body as UpdateTenderRequest;
  
  if (!validatedData) {
    return errorResponse(res, 'Invalid request data', 400);
  }
  
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  let paramCount = 1;
  
  Object.entries(validatedData).forEach(([key, value]) => {
    if (value !== undefined) {
      // Convert camelCase to snake_case for database
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${snakeKey} = $${paramCount}`);
      values.push(value as string | number | null);
      paramCount++;
    }
  });
  
  if (fields.length === 0) {
    return errorResponse(res, 'No fields to update', 400);
  }
  
  if (!id) {
    return errorResponse(res, 'Tender ID is required', 400);
  }
  
  values.push(id);
  const query = `UPDATE tenders SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
  
  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    return errorResponse(res, 'Tender not found', 404);
  }
  
  successResponse(res, result.rows[0], 'Tender updated successfully');
});

export const updateTenderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return errorResponse(res, 'Status is required', 400);
  }
  
  const result = await pool.query(
    `UPDATE tenders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
    [status, id]
  );
  
  if (result.rows.length === 0) {
    return errorResponse(res, 'Tender not found', 404);
  }
  
  successResponse(res, result.rows[0], 'Tender status updated successfully');
});

export const deleteTender = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const result = await pool.query('DELETE FROM tenders WHERE id = $1 RETURNING *', [id]);
  
  if (result.rows.length === 0) {
    return errorResponse(res, 'Tender not found', 404);
  }
  
  successResponse(res, null, 'Tender deleted successfully');
});

