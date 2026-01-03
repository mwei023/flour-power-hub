import { Request, Response } from 'express';
import { pool } from '../config/database';
import { asyncHandler, successResponse, errorResponse } from '../middleware/validation';

export const getDailySummary = asyncHandler(async (req: Request, res: Response) => {
  const date = req.query['date'] as string || new Date().toISOString().split('T')[0];
  
  try {
    // Get today's date range
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;
    
    // Get transaction summary for the day
    const transactionQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(kilos), 0) as total_kilos,
        COALESCE(SUM(total_price), 0) as total_income,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_price ELSE 0 END), 0) as cash_income,
        COALESCE(SUM(CASE WHEN payment_method = 'mpesa' THEN total_price ELSE 0 END), 0) as mpesa_income,
        COALESCE(SUM(CASE WHEN payment_method = 'credit' THEN total_price ELSE 0 END), 0) as credit_given
      FROM transactions 
      WHERE created_at >= $1 AND created_at <= $2
        AND status != 'cancelled'
    `;
    
    const transactionResult = await pool.query(transactionQuery, [startOfDay, endOfDay]);
    const txData = transactionResult.rows[0];
    
    // Get expenses for the day
    const expenseQuery = `
      SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM expenses 
      WHERE created_at >= $1 AND created_at <= $2
    `;
    
    const expenseResult = await pool.query(expenseQuery, [startOfDay, endOfDay]);
    const totalExpenses = parseFloat(expenseResult.rows[0].total_expenses) || 0;
    
    // Calculate net profit
    const totalIncome = parseFloat(txData.total_income) || 0;
    const netProfit = totalIncome - totalExpenses;
    
    successResponse(res, {
      date: date,
      total_transactions: parseInt(txData.total_transactions) || 0,
      total_kilos: parseFloat(txData.total_kilos) || 0,
      total_income: totalIncome,
      cash_income: parseFloat(txData.cash_income) || 0,
      mpesa_income: parseFloat(txData.mpesa_income) || 0,
      credit_given: parseFloat(txData.credit_given) || 0,
      total_expenses: totalExpenses,
      net_profit: netProfit,
    });
  } catch (error) {
    console.error('Daily summary error:', error);
    errorResponse(res, 'Failed to calculate daily summary', 500);
  }
});

export const getDateRangeSummary = asyncHandler(async (req: Request, res: Response) => {
  successResponse(res, {
    start_date: req.query['start_date'] || '2024-01-01',
    end_date: req.query['end_date'] || new Date().toISOString().split('T')[0],
    summary: {
      total_transactions: 0,
      total_kilos: 0,
      total_income: 0,
      total_expenses: 0,
      net_profit: 0,
    }
  }, 'Report endpoints coming soon');
});

export const exportDailyReport = asyncHandler(async (_req: Request, res: Response) => {
  successResponse(res, {
    format: 'csv',
    message: 'Export functionality coming soon',
    download_url: null,
  }, 'Report export coming soon');
});
