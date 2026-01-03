// Handle incoming C2B notifications from Safaricom
import { Request, Response } from 'express';
import { pool } from '../config/database';



export const handleC2BNotification = async (req: Request, res: Response) => {
  try {
    const { TransAmount, MSISDN, TransID, BillRefNumber } = req.body;

    console.log('✅ M-Pesa payment received:', { TransID, MSISDN, TransAmount });

    // For now, just log it to database
    await pool.query(
      `INSERT INTO mpesa_payments (transaction_id, phone, amount, bill_ref, received_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [TransID, MSISDN, TransAmount, BillRefNumber || null]
    );

    console.log('✅ M-Pesa payment logged to database successfully');

    // Auto-match to pending transactions?
    // You can add logic here to update `transactions.status = 'paid'`

    // Always respond with 200 — or Safaricom will retry!
    res.status(200).json({
      ResultDesc: "Accepted",
      ResultCode: 0
    });
  } catch (error) {
    console.error('C2B handler error:', error);
    // Respond with error so Safaricom knows there was an issue
    res.status(500).json({
      ResultDesc: "Internal Server Error",
      ResultCode: 1
    });
  }
};
