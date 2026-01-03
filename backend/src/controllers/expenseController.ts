import { Request, Response } from 'express';
import { pool } from '../config/database';
import { asyncHandler, successResponse, errorResponse, createPaginationResponse } from '../middleware/validation';
import type { CreateExpenseRequest, UpdateExpenseRequest } from '../types';

// Extend Request type to include validatedData
interface ValidatedRequest extends Request {
  validatedData?: {
    body?: CreateExpenseRequest | UpdateExpenseRequest;
  };
}

export const getAllExpenses = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 20;
  const offset = (page - 1) * limit;
  const search = req.query['search'] as string;
  const category = req.query['category'] as string;
  const startDate = req.query['start_date'] as string;
  const endDate = req.query['end_date'] as string;
  
  let query = 'SELECT * FROM expenses WHERE 1=1';
  const params: (string | number | null)[] = [];
  let paramCount = 1;
  
  if (search) {
    query += ` AND (reason ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }
  
  if (category) {
    query += ` AND category = $${paramCount}`;
    params.push(category);
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
  let countQuery = 'SELECT COUNT(*) FROM expenses WHERE 1=1';
  const countParams: (string | number | null)[] = [];
  
  if (search) {
    countQuery += ` AND (reason ILIKE $${countParams.length + 1})`;
    countParams.push(`%${search}%`);
  }
  if (category) {
    countQuery += ` AND category = $${countParams.length + 1}`;
    countParams.push(category);
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

export const getExpenseById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const result = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
  
  if (result.rows.length === 0) {
    return errorResponse(res, 'Expense not found', 404);
  }
  
  successResponse(res, result.rows[0]);
});

export const getTodayExpenses = asyncHandler(async (_req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];
  
  const result = await pool.query(
    `SELECT * FROM expenses 
     WHERE DATE(created_at) = $1 
     ORDER BY created_at DESC`,
    [today]
  );
  
  successResponse(res, result.rows);
});

export const createExpense = asyncHandler(async (req: ValidatedRequest, res: Response) => {
  const validatedData = req.validatedData?.body as CreateExpenseRequest;
  
  if (!validatedData) {
    return errorResponse(res, 'Invalid request data', 400);
  }
  
  const { amount, reason, category } = validatedData;
  
  const result = await pool.query(
    `INSERT INTO expenses (amount, reason, category) 
     VALUES ($1, $2, $3) 
     RETURNING *`,
    [amount, reason, category || 'other']
  );
  
  successResponse(res, result.rows[0], 'Expense created successfully', 201);
});

export const updateExpense = asyncHandler(async (req: ValidatedRequest, res: Response) => {
  const { id } = req.params;
  const validatedData = req.validatedData?.body as UpdateExpenseRequest;
  
  if (!validatedData) {
    return errorResponse(res, 'Invalid request data', 400);
  }
  
  const fields: string[] = [];
  const values: (string | number)[] = [];
  let paramCount = 1;
  
  Object.entries(validatedData).forEach(([key, value]) => {
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
    return errorResponse(res, 'Expense ID is required', 400);
  }
  
  values.push(id);
  const query = `UPDATE expenses SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
  
  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    return errorResponse(res, 'Expense not found', 404);
  }
  
  successResponse(res, result.rows[0], 'Expense updated successfully');
});

export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);
  
  if (result.rows.length === 0) {
    return errorResponse(res, 'Expense not found', 404);
  }
  
  successResponse(res, null, 'Expense deleted successfully');
});

