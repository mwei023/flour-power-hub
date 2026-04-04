import { Request, Response } from 'express';
import { pool } from '../config/database';
import { asyncHandler, successResponse, errorResponse, createPaginationResponse } from '../middleware/validation';
import axios from 'axios';

// M-Pesa Configuration from environment variables
const MPESA_CONFIG = {
  // Consumer credentials from Daraja portal
  consumerKey: process.env['MPESA_CONSUMER_KEY'] || '',
  consumerSecret: process.env['MPESA_CONSUMER_SECRET'] || '',
  // Test credentials (defaults for sandbox)
  initiatorName: process.env['MPESA_INITIATOR_NAME'] || 'testapi',
  initiatorPassword: process.env['MPESA_INITIATOR_PASSWORD'] || 'Safaricom123!!',
  shortcode: process.env['MPESA_SHORTCODE'] || '174379',
  passkey: process.env['MPESA_PASSKEY'] || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  // Business shortcode
  businessShortcode: process.env['MPESA_BUSINESS_SHORTCODE'] || '174379',
  partyA: process.env['MPESA_PARTY_A'] || '600997',
  partyB: process.env['MPESA_PARTY_B'] || '600000',
  // Environment
  env: process.env['MPESA_ENV'] || 'sandbox',
  // Base URLs
  baseUrl: process.env['MPESA_ENV'] === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke',
  authUrl: '/oauth/v1/generate?grant_type=client_credentials',
  stkPushUrl: '/mpesa/stkpush/v1/processrequest',
  stkStatusUrl: '/mpesa/stkpushquery/v1/query',
  c2bRegisterUrl: '/mpesa/c2b/v1/registerurl',
  c2bSimulateUrl: '/mpesa/c2b/v1/simulate',
  b2cUrl: '/mpesa/b2c/v1/paymentrequest',
  transactionStatusUrl: '/mpesa/transactionstatus/v1/get',
  accountBalanceUrl: '/mpesa/accountbalance/v1/query',
};

// Get M-Pesa access token
const getAccessToken = async (): Promise<string> => {
  const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
  
  try {
    const response = await axios.get(`${MPESA_CONFIG.baseUrl}${MPESA_CONFIG.authUrl}`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get M-Pesa access token:', error);
    throw new Error('Failed to authenticate with M-Pesa');
  }
};

// Generate password for STK Push
const generatePassword = (): { password: string; timestamp: string } => {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(
    `${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`
  ).toString('base64');
  return { password, timestamp };
};

// Generate security credential for B2C
const generateSecurityCredential = (): string => {
  // In production, you need to generate this from the initiator password using RSA encryption
  // For sandbox testing, you can use the initiator password as-is
  return MPESA_CONFIG.initiatorPassword;
};

// ==================== C2B WEBHOOK ====================

// Handle incoming C2B notifications from Safaricom
export const handleC2BNotification = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    // TransTime is provided by Safaricom but not used in our logic — kept for logging/future use
    const { TransAmount, MSISDN, TransID, BillRefNumber } = req.body;

    console.log('✅ M-Pesa payment received:', { TransID, MSISDN, TransAmount });

    await client.query('BEGIN');

    // Check if this transaction already exists (idempotency)
    const existingPayment = await client.query(
      'SELECT id, status FROM mpesa_payments WHERE transaction_id = $1',
      [TransID]
    );

    if (existingPayment.rows.length > 0) {
      console.log('⚠️  Duplicate payment detected:', TransID);
      await client.query('ROLLBACK');
      return res.status(200).json({
        ResultDesc: "Accepted (Duplicate)",
        ResultCode: 0
      });
    }

    // Insert the payment record
    const insertResult = await client.query(
      `INSERT INTO mpesa_payments (transaction_id, phone, amount, bill_ref, received_at, raw_data, status) 
       VALUES ($1, $2, $3, $4, NOW(), $5, 'pending')
       RETURNING id`,
      [TransID, MSISDN, TransAmount, BillRefNumber || null, JSON.stringify(req.body)]
    );

    const mpesaPaymentId = insertResult.rows[0].id;
    console.log('✅ M-Pesa payment logged to database successfully:', mpesaPaymentId);

    // Try to match with existing pending transaction by phone and amount
    const normalizePhone = (phone: string) => {
      let normalized = phone.replace(/^\+254/, '0').replace(/^254/, '');
      if (normalized.length === 10 && normalized.startsWith('0')) {
        normalized = '254' + normalized.slice(1);
      }
      return normalized;
    };

    const normalizedMsisdn = normalizePhone(MSISDN);

    // Look for pending transaction with same phone and amount
    const matchResult = await client.query(
      `SELECT id, customer_name, total_price FROM transactions 
       WHERE payment_method = 'mpesa' 
         AND status = 'pending'
         AND ABS(total_price - $1) <= $1 * 0.05
         AND (
           customer_id IN (
             SELECT id FROM customers WHERE phone LIKE $2 OR phone LIKE $3
           )
           OR customer_name LIKE '%' || $4 || '%'
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [TransAmount, `%${normalizedMsisdn}%`, `%${MSISDN}%`, MSISDN]
    );

    if (matchResult.rows.length > 0) {
      const transaction = matchResult.rows[0];
      
      await client.query(
        `UPDATE transactions SET status = 'completed', updated_at = NOW() WHERE id = $1`,
        [transaction.id]
      );

      await client.query(
        `UPDATE mpesa_payments SET status = 'matched', matched_at = NOW(), matched_transaction_id = $1 WHERE id = $2`,
        [transaction.id, mpesaPaymentId]
      );

      console.log('✅ Payment matched to existing transaction:', transaction.id);
    } else {
      // Auto-create transaction
      const receiptNumber = `MPE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const customerResult = await client.query(
        'SELECT id, name FROM customers WHERE phone LIKE $1 OR phone LIKE $2 LIMIT 1',
        [`%${normalizedMsisdn}%`, `%${MSISDN}%`]
      );

      const customerId = customerResult.rows[0]?.id || null;
      const customerName = customerResult.rows[0]?.name || `M-Pesa ${MSISDN}`;

      const transactionResult = await client.query(
        `INSERT INTO transactions 
          (customer_id, customer_name, grain_type, kilos, milling_count, price_per_kilo, total_price, 
           payment_method, status, notes, receipt_number, processed_by)
         VALUES ($1, $2, 'maize', 0, 1, 0, $3, 'mpesa', 'completed', 
          $4, $5, 'M-Pesa Auto-Create')
         RETURNING id`,
        [customerId, customerName, TransAmount, `Auto-created: ${TransID}`, receiptNumber]
      );

      await client.query(
        `UPDATE mpesa_payments SET status = 'matched', matched_at = NOW(), matched_transaction_id = $1 WHERE id = $2`,
        [transactionResult.rows[0].id, mpesaPaymentId]
      );
    }

    await client.query('COMMIT');

    res.status(200).json({
      ResultDesc: "Accepted",
      ResultCode: 0
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('C2B handler error:', error);
    res.status(500).json({
      ResultDesc: "Internal Server Error",
      ResultCode: 1
    });
  } finally {
    client.release();
  }
};

// ==================== STK PUSH ====================

// Initiate STK Push payment request
export const initiateStkPush = asyncHandler(async (req: Request, res: Response) => {
  const { phoneNumber, amount, accountReference, transactionDesc } = req.body;

  if (!phoneNumber || !amount) {
    return errorResponse(res, 'Phone number and amount are required', 400);
  }

  // Validate phone number format
  let normalizedPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '254' + normalizedPhone.slice(1);
  }
  if (!normalizedPhone.startsWith('254') || normalizedPhone.length !== 12) {
    return errorResponse(res, 'Invalid phone number format', 400);
  }

  try {
    const accessToken = await getAccessToken();
    const { password, timestamp } = generatePassword();

    const requestBody = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount), // Must be whole number
      PartyA: normalizedPhone,
      PartyB: MPESA_CONFIG.shortcode,
      PhoneNumber: normalizedPhone,
      CallBackURL: `${process.env['API_BASE_URL'] || 'https://api.mwei.co.ke'}/api/payments/webhook`,
      AccountReference: accountReference || 'PoshoMill',
      TransactionDesc: transactionDesc || 'Milling Payment',
    };

    console.log('📱 Initiating STK Push:', { phone: normalizedPhone, amount });

    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}${MPESA_CONFIG.stkPushUrl}`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Store the checkout request ID for status checking
    if (response.data.CheckoutRequestID) {
      await pool.query(
        `INSERT INTO mpesa_stk_requests (checkout_request_id, phone, amount, status) 
         VALUES ($1, $2, $3, 'pending')`,
        [response.data.CheckoutRequestID, normalizedPhone, amount]
      );
    }

    console.log('✅ STK Push initiated:', response.data);

    successResponse(res, {
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID,
      responseCode: response.data.ResponseCode,
      responseDesc: response.data.ResponseDescription,
      customerMessage: response.data.CustomerMessage,
    }, 'STK Push initiated successfully');
  } catch (error: unknown) {
    console.error('STK Push error:', error);
    const axiosError = error as { response?: { data?: { errorMessage?: string } } };
    errorResponse(res, axiosError.response?.data?.errorMessage || 'Failed to initiate STK Push', 500);
  }
});

// Check STK Push status
export const checkStkStatus = asyncHandler(async (req: Request, res: Response) => {
  const { checkoutRequestId } = req.params;

  if (!checkoutRequestId) {
    return errorResponse(res, 'Checkout request ID is required', 400);
  }

  try {
    const accessToken = await getAccessToken();
    const { password, timestamp } = generatePassword();

    const requestBody = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}${MPESA_CONFIG.stkStatusUrl}`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Update local record
    await pool.query(
      `UPDATE mpesa_stk_requests 
       SET status = $1, result_desc = $2, updated_at = NOW()
       WHERE checkout_request_id = $3`,
      [response.data.ResultCode === 0 ? 'completed' : 'failed', response.data.ResultDesc, checkoutRequestId]
    );

    successResponse(res, {
      checkoutRequestId: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode,
      responseDesc: response.data.ResponseDescription,
      resultCode: response.data.ResultCode,
      resultDesc: response.data.ResultDesc,
    }, 'STK status retrieved');
  } catch (error: unknown) {
    console.error('STK Status check error:', error);
    const axiosError = error as { response?: { data?: { errorMessage?: string } } };
    errorResponse(res, axiosError.response?.data?.errorMessage || 'Failed to check STK status', 500);
  }
});

// ==================== B2C (REFUNDS) ====================

// Initiate B2C payment (refunds or payments to customers)
export const initiateB2CPayment = asyncHandler(async (req: Request, res: Response) => {
  const { phoneNumber, amount, remarks, occasion } = req.body;

  if (!phoneNumber || !amount) {
    return errorResponse(res, 'Phone number and amount are required', 400);
  }

  let normalizedPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '254' + normalizedPhone.slice(1);
  }

  try {
    const accessToken = await getAccessToken();

    const requestBody = {
      InitiatorName: MPESA_CONFIG.initiatorName,
      InitiatedID: Date.now().toString(),
      SecurityCredential: generateSecurityCredential(),
      CommandID: 'BusinessPayment', // or 'SalaryPayment' or 'PromotionPayment'
      Amount: Math.round(amount),
      PartyA: MPESA_CONFIG.shortcode,
      PartyB: normalizedPhone,
      Remarks: remarks || 'Refund',
      QueueTimeOutURL: `${process.env['API_BASE_URL'] || 'https://api.mwei.co.ke'}/api/payments/b2c/timeout`,
      ResultURL: `${process.env['API_BASE_URL'] || 'https://api.mwei.co.ke'}/api/payments/b2c/result`,
      Occasion: occasion || '',
    };

    console.log('💸 Initiating B2C Payment:', { phone: normalizedPhone, amount });

    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}${MPESA_CONFIG.b2cUrl}`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Record the transaction
    if (response.data.ConversationID) {
      await pool.query(
        `INSERT INTO mpesa_b2c_transactions (conversation_id, initiator_id, phone, amount, status, command_id) 
         VALUES ($1, $2, $3, $4, 'pending', $5)`,
        [response.data.ConversationID, response.data.InitiatorID, normalizedPhone, amount, requestBody.CommandID]
      );
    }

    console.log('✅ B2C Payment initiated:', response.data);

    successResponse(res, {
      conversationId: response.data.ConversationID,
      initiatorId: response.data.InitiatorID,
      responseCode: response.data.ResponseCode,
      responseDesc: response.data.ResponseDescription,
    }, 'B2C payment initiated successfully');
  } catch (error: unknown) {
    console.error('B2C Payment error:', error);
    const axiosError = error as { response?: { data?: { errorMessage?: string } } };
    errorResponse(res, axiosError.response?.data?.errorMessage || 'Failed to initiate B2C payment', 500);
  }
});

// B2C Result callback
export const handleB2CResult = asyncHandler(async (req: Request, res: Response) => {
  const { Result } = req.body;
  
  console.log('📥 B2C Result received:', Result);

  await pool.query(
    `UPDATE mpesa_b2c_transactions 
     SET status = $1, result = $2, completed_at = NOW()
     WHERE conversation_id = $3`,
    [
      Result.ResultCode === 0 ? 'completed' : 'failed',
      JSON.stringify(Result),
      Result.ConversationID
    ]
  );

  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// B2C Timeout callback
export const handleB2CTimeout = asyncHandler(async (req: Request, res: Response) => {
  const { Result } = req.body;
  
  console.log('⏰ B2C Timeout received:', Result);

  await pool.query(
    `UPDATE mpesa_b2c_transactions 
     SET status = 'timeout', result = $1, updated_at = NOW()
     WHERE conversation_id = $2`,
    [JSON.stringify(Result), Result.ConversationID]
  );

  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// ==================== TRANSACTION STATUS ====================

// Check transaction status
export const checkTransactionStatus = asyncHandler(async (req: Request, res: Response) => {
  const { transactionId } = req.params;

  if (!transactionId) {
    return errorResponse(res, 'Transaction ID is required', 400);
  }

  try {
    const accessToken = await getAccessToken();
    // password and timestamp are used in the STK push request body below
    const { password, timestamp } = generatePassword();

    const requestBody = {
      Initiator: MPESA_CONFIG.initiatorName,
      SecurityCredential: generateSecurityCredential(),
      CommandID: 'TransactionStatusQuery',
      TransactionID: transactionId,
      PartyA: MPESA_CONFIG.shortcode,
      IdentifierType: '4',
      Password: password,
      Timestamp: timestamp,
      ResultURL: `${process.env['API_BASE_URL'] || 'https://api.mwei.co.ke'}/api/payments/status/result`,
      QueueTimeOutURL: `${process.env['API_BASE_URL'] || 'https://api.mwei.co.ke'}/api/payments/status/timeout`,
    };

    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}${MPESA_CONFIG.transactionStatusUrl}`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    successResponse(res, {
      transactionId: response.data.TransactionID,
      responseCode: response.data.ResponseCode,
      responseDesc: response.data.ResponseDescription,
      resultCode: response.data.ResultCode,
      resultDesc: response.data.ResultDesc,
    }, 'Transaction status retrieved');
  } catch (error: unknown) {
    console.error('Transaction status error:', error);
    const axiosError = error as { response?: { data?: { errorMessage?: string } } };
    errorResponse(res, axiosError.response?.data?.errorMessage || 'Failed to check transaction status', 500);
  }
});

// ==================== ACCOUNT BALANCE ====================

// Check account balance
export const checkAccountBalance = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const accessToken = await getAccessToken();
    // password and timestamp included in request body for M-Pesa auth
    const { password, timestamp } = generatePassword();

    const requestBody = {
      Initiator: MPESA_CONFIG.initiatorName,
      SecurityCredential: generateSecurityCredential(),
      CommandID: 'AccountBalance',
      PartyA: MPESA_CONFIG.shortcode,
      IdentifierType: '4',
      Password: password,
      Timestamp: timestamp,
      ResultURL: `${process.env['API_BASE_URL'] || 'https://api.mwei.co.ke'}/api/payments/balance/result`,
      QueueTimeOutURL: `${process.env['API_BASE_URL'] || 'https://api.mwei.co.ke'}/api/payments/balance/timeout`,
    };

    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}${MPESA_CONFIG.accountBalanceUrl}`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    successResponse(res, {
      responseCode: response.data.ResponseCode,
      responseDesc: response.data.ResponseDescription,
    }, 'Balance query initiated');
  } catch (error: unknown) {
    console.error('Account balance error:', error);
    const axiosError = error as { response?: { data?: { errorMessage?: string } } };
    errorResponse(res, axiosError.response?.data?.errorMessage || 'Failed to check account balance', 500);
  }
});

// ==================== C2B SIMULATION (TESTING) ====================

// Simulate C2B transaction (for testing)
export const simulateC2B = asyncHandler(async (req: Request, res: Response) => {
  const { amount, phoneNumber, billRef } = req.body;

  if (!amount || !phoneNumber) {
    return errorResponse(res, 'Amount and phone number are required', 400);
  }

  let normalizedPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '254' + normalizedPhone.slice(1);
  }

  try {
    const accessToken = await getAccessToken();

    const requestBody = {
      ShortCode: MPESA_CONFIG.shortcode,
      CommandID: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      Msisdn: normalizedPhone,
      BillRefNumber: billRef || 'Test',
    };

    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}${MPESA_CONFIG.c2bSimulateUrl}`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ C2B Simulated:', response.data);

    successResponse(res, {
      responseCode: response.data.ResponseCode,
      responseDesc: response.data.ResponseDescription,
    }, 'C2B simulation successful');
  } catch (error: unknown) {
    console.error('C2B simulation error:', error);
    const axiosError = error as { response?: { data?: { errorMessage?: string } } };
    errorResponse(res, axiosError.response?.data?.errorMessage || 'Failed to simulate C2B', 500);
  }
});

// ==================== QUERY ENDPOINTS ====================

// Get all M-Pesa payments (with pagination and filters)
export const getAllMpesaPayments = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 20;
  const offset = (page - 1) * limit;
  const status = req.query['status'] as string;
  const startDate = req.query['start_date'] as string;
  const endDate = req.query['end_date'] as string;
  const search = req.query['search'] as string;

  let query = `
    SELECT mp.*, t.receipt_number, t.customer_name as matched_customer
    FROM mpesa_payments mp
    LEFT JOIN transactions t ON t.id = mp.matched_transaction_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  let paramCount = 1;

  if (status) {
    query += ` AND mp.status = $${paramCount}`;
    params.push(status);
    paramCount++;
  }

  if (startDate) {
    query += ` AND mp.received_at >= $${paramCount}`;
    params.push(startDate);
    paramCount++;
  }

  if (endDate) {
    query += ` AND mp.received_at <= $${paramCount}`;
    params.push(endDate);
    paramCount++;
  }

  if (search) {
    query += ` AND (mp.transaction_id ILIKE $${paramCount} OR mp.phone ILIKE $${paramCount} OR t.customer_name ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }

  query += ` ORDER BY mp.received_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM mpesa_payments WHERE 1=1';
  const countParams: (string | number)[] = [];

  if (status) {
    countQuery += ` AND status = $${countParams.length + 1}`;
    countParams.push(status);
  }
  if (startDate) {
    countQuery += ` AND received_at >= $${countParams.length + 1}`;
    countParams.push(startDate);
  }
  if (endDate) {
    countQuery += ` AND received_at <= $${countParams.length + 1}`;
    countParams.push(endDate);
  }

  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count);

  successResponse(res, createPaginationResponse(result.rows, total, page, limit));
});

// Get single M-Pesa payment by ID
export const getMpesaPaymentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT mp.*, t.receipt_number, t.customer_name as matched_customer, t.kilos, t.total_price as transaction_total
     FROM mpesa_payments mp
     LEFT JOIN transactions t ON t.id = mp.matched_transaction_id
     WHERE mp.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return errorResponse(res, 'M-Pesa payment not found', 404);
  }

  successResponse(res, result.rows[0]);
});

// Get M-Pesa payments summary/stats
export const getMpesaSummary = asyncHandler(async (req: Request, res: Response) => {
  const date = req.query['date'] as string || new Date().toISOString().split('T')[0];

  const result = await pool.query(
    `SELECT 
       COUNT(*) as total_count,
       COALESCE(SUM(amount), 0) as total_amount,
       COUNT(CASE WHEN status = 'matched' THEN 1 END) as matched_count,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
       COALESCE(SUM(CASE WHEN status = 'matched' THEN amount ELSE 0 END), 0) as matched_amount
     FROM mpesa_payments
     WHERE DATE(received_at) = $1`,
    [date]
  );

  const stats = result.rows[0];
  successResponse(res, {
    date,
    totalCount: parseInt(stats.total_count),
    totalAmount: parseFloat(stats.total_amount),
    matchedCount: parseInt(stats.matched_count),
    pendingCount: parseInt(stats.pending_count),
    matchedAmount: parseFloat(stats.matched_amount),
    pendingAmount: parseFloat(stats.total_amount) - parseFloat(stats.matched_amount),
  });
});
// ==================== C2B URL REGISTRATION ====================

// Register C2B webhook URL with Safaricom (call once)
export const registerC2BUrl = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const accessToken = await getAccessToken();

    const callbackUrl = `${process.env['API_BASE_URL'] || 'https://flour-power-hub.onrender.com'}/api/v1/mpesa-payments/webhook`;

    const requestBody = {
      ShortCode: MPESA_CONFIG.shortcode,
      ResponseType: 'Completed',
      ConfirmationURL: callbackUrl,
      ValidationURL: callbackUrl,
    };

    console.log('📝 Registering C2B URL:', callbackUrl);

    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}${MPESA_CONFIG.c2bRegisterUrl}`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ C2B URL registered:', response.data);

    successResponse(res, {
      confirmationUrl: callbackUrl,
      validationUrl: callbackUrl,
      responseCode: response.data.ResponseCode,
      responseDesc: response.data.ResponseDescription,
    }, 'C2B URL registered successfully');
  } catch (error: unknown) {
    console.error('C2B registration error:', error);
    const axiosError = error as { response?: { data?: { errorMessage?: string } } };
    errorResponse(res, axiosError.response?.data?.errorMessage || 'Failed to register C2B URL', 500);
  }
});
