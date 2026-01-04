import { Request, Response } from 'express';
import { pool } from '../config/database';
import { asyncHandler, successResponse, errorResponse, createPaginationResponse } from '../middleware/validation';
import type { CreateCustomerRequest, UpdateCustomerRequest } from '../types';

// Extended Request type with validated data from validation middleware
interface ValidatedRequest<T = unknown> extends Request {
  validatedData?: {
    body?: T;
    query?: T;
    params?: T;
  };
}

export const getAllCustomers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 20;
  const offset = parseInt(req.query['offset'] as string) || (page - 1) * limit;
  const search = req.query['search'] as string;
  const type = req.query['type'] as string;
  
  let query = 'SELECT * FROM customers WHERE 1=1';
  const params: (string | number)[] = [];
  let paramCount = 1;
  
  if (search) {
    query += ` AND (name ILIKE $${paramCount} OR phone ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }
  
  if (type) {
    query += ` AND type = $${paramCount}`;
    params.push(type);
    paramCount++;
  }
  
  // Add pagination - ensure valid values
  const safeLimit = isNaN(limit) ? 20 : Math.max(1, limit);
  const safeOffset = isNaN(offset) ? 0 : Math.max(0, offset);
  query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(safeLimit, safeOffset);
  
  const result = await pool.query(query, params);
  
  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) FROM customers WHERE 1=1';
  const countParams: (string | number)[] = [];
  
  if (search) {
    countQuery += ` AND (name ILIKE $${countParams.length + 1} OR phone ILIKE $${countParams.length + 1})`;
    countParams.push(`%${search}%`);
  }
  
  if (type) {
    countQuery += ` AND type = $${countParams.length + 1}`;
    countParams.push(type);
  }
  
  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count) || 0;
  
  successResponse(res, createPaginationResponse(result.rows, total, page, limit));
});

export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
  
  if (result.rows.length === 0) {
    return errorResponse(res, 'Customer not found', 404);
  }
  
  successResponse(res, result.rows[0]);
});

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = (req as ValidatedRequest<CreateCustomerRequest>).validatedData?.body;
  
  if (!validatedData) {
    return errorResponse(res, 'Invalid request data', 400);
  }
  
  const { name, phone, type } = validatedData;
  
  const result = await pool.query(
    'INSERT INTO customers (name, phone, type) VALUES ($1, $2, $3) RETURNING *',
    [name, phone, type]
  );
  
  successResponse(res, result.rows[0], 'Customer created successfully', 201);
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = (req as ValidatedRequest<UpdateCustomerRequest>).validatedData?.body;
  
  if (!validatedData) {
    return errorResponse(res, 'Invalid request data', 400);
  }
  
  const fields: string[] = [];
  const values: (string | number)[] = [];
  let paramCount = 1;
  
  Object.entries(validatedData).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value as string | number);
      paramCount++;
    }
  });
  
  if (fields.length === 0) {
    return errorResponse(res, 'No fields to update', 400);
  }
  
  if (!id) {
    return errorResponse(res, 'Customer ID is required', 400);
  }
  
  values.push(id);
  const query = `UPDATE customers SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
  
  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    return errorResponse(res, 'Customer not found', 404);
  }
  
  successResponse(res, result.rows[0], 'Customer updated successfully');
});

export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING *', [id]);
  
  if (result.rows.length === 0) {
    return errorResponse(res, 'Customer not found', 404);
  }
  
  successResponse(res, null, 'Customer deleted successfully');
});

export const getCreditCustomers = asyncHandler(async (_req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT * FROM customers WHERE credit_balance > 0 ORDER BY credit_balance DESC'
  );
  
  successResponse(res, result.rows);
});
