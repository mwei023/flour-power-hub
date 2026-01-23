# M-Pesa Daraja API Integration Setup Guide

## Overview
This document provides instructions for setting up the M-Pesa Daraja API integration for the Posho Mill Tracker application.

## Prerequisites

### 1. Get M-Pesa Developer Account
1. Go to https://developer.safaricom.co.ke
2. Register for a free account
3. Create an app to get your Consumer Key and Consumer Secret

### 2. Test Credentials (Sandbox)
The following test credentials are provided for sandbox testing:

| Field | Value |
|-------|-------|
| Initiator Name | testapi |
| Initiator Password | Safaricom123!! |
| Party A | 600997 |
| Party B | 600000 |
| Phone No | 254708374149 |
| Business ShortCode | 174379 |
| Passkey | bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919 |

## Setup Steps

### Step 1: Configure Environment Variables

1. Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

2. Edit `.env` and fill in your M-Pesa credentials:
```env
MPESA_CONSUMER_KEY=your-consumer-key-from-daraja
MPESA_CONSUMER_SECRET=your-consumer-secret-from-daraja
MPESA_ENV=sandbox  # Change to 'production' when going live
```

### Step 2: Update Database Schema

Run the update schema SQL script to create the necessary tables:

```bash
psql -h localhost -U mwei -d poshomill -f database/update_schema.sql
```

This creates:
- `mpesa_stk_requests` - Track STK Push requests
- `mpesa_b2c_transactions` - Track B2C transactions
- `mpesa_status_queries` - Track status queries
- `mpesa_balance_queries` - Track balance queries

### Step 3: Install Dependencies

```bash
cd backend
npm install
```

### Step 4: Start the Server

```bash
npm run dev
```

## API Endpoints

### C2B Webhook (Receiving Payments)
```
POST /api/payments/webhook
```
Safaricom will send payment notifications to this endpoint.

### STK Push (Initiate Payment)
```
POST /api/payments/stkpush
Content-Type: application/json
Authorization: Bearer <token>

{
  "phoneNumber": "254700000000",
  "amount": 100,
  "accountReference": "Order123",
  "transactionDesc": "Milling Payment"
}
```

### Check STK Push Status
```
GET /api/payments/stkpush/:checkoutRequestId
```

### B2C (Refund to Customer)
```
POST /api/payments/b2c
Authorization: Bearer <token> (boss only)

{
  "phoneNumber": "254700000000",
  "amount": 100,
  "remarks": "Refund for overpayment"
}
```

### Check Transaction Status
```
GET /api/payments/status/:transactionId
```

### Check Account Balance
```
GET /api/payments/balance
```

### Simulate C2B (Testing Only)
```
POST /api/payments/simulate

{
  "amount": 100,
  "phoneNumber": "254700000000",
  "billRef": "Test123"
}
```

### Get All M-Pesa Payments
```
GET /api/payments?page=1&limit=20&status=matched
```

### Get M-Pesa Summary
```
GET /api/payments/summary
```

## Testing

### 1. Test with Sandbox Simulator

Use the Simulate C2B endpoint to test incoming payments:

```bash
curl -X POST http://localhost:3001/api/payments/simulate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "amount": 100,
    "phoneNumber": "254708374149",
    "billRef": "Test123"
  }'
```

### 2. Test STK Push

Use the STK Push endpoint to send payment requests:

```bash
curl -X POST http://localhost:3001/api/payments/stkpush \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "phoneNumber": "254708374149",
    "amount": 100,
    "accountReference": "Test123"
  }'
```

### 3. Verify Database

Connect to the database and verify payments are recorded:

```bash
psql -h localhost -U mwei -d poshomill

-- Check M-Pesa payments
SELECT * FROM mpesa_payments ORDER BY received_at DESC LIMIT 10;

-- Check if transactions were created
SELECT * FROM transactions WHERE payment_method = 'mpesa' ORDER BY created_at DESC LIMIT 10;
```

## Production Deployment

### 1. Get Production Credentials

1. Go to https://developer.safaricom.co.ke
2. Submit your app for production approval
3. Get production Consumer Key and Consumer Secret

### 2. Update Environment Variables

```env
MPESA_ENV=production
MPESA_CONSUMER_KEY=your-production-consumer-key
MPESA_CONSUMER_SECRET=your-production-consumer-secret
```

### 3. Register Callback URLs

In your Daraja dashboard, register the following callback URLs:
- C2B Callback: https://amani.mwei.co.ke/api/payments/webhook
- B2C Result URL: https://amani.mwei.co.ke/api/payments/b2c/result
- B2C Timeout URL: https://amani.mwei.co.ke/api/payments/b2c/timeout

### 4. Generate Security Credential

For B2C transactions in production, you need to generate a proper security credential:
1. Download the certificate from Daraja portal
2. Use OpenSSL to encrypt your initiator password:
```bash
openssl smime -sign -in data.txt -textout -out signature.pem \
  -signer daraja-cert.pem -inkey private-key.pem
```

## Troubleshooting

### "Failed to get M-Pesa access token"
- Check your Consumer Key and Consumer Secret
- Ensure you're using the correct environment (sandbox vs production)
- Check network connectivity to Safaricom API

### Webhook not receiving notifications
- Ensure your callback URL is publicly accessible (HTTPS required for production)
- Check that your server is running and accessible
- Verify the URL is registered in Daraja portal

### STK Push not working
- Ensure phone number is in format 254XXXXXXXXX
- Check that the amount is a whole number (no decimals)
- Verify account has sufficient funds

### Transactions not creating
- Check database connection is working
- Verify the mpesa_payments table exists with correct columns
- Check server logs for any errors

## Files Modified

- `backend/src/controllers/mpesaController.ts` - Main M-Pesa controller
- `backend/src/routes/mpesaRoutes.ts` - API routes
- `backend/database/update_schema.sql` - Database tables
- `backend/package.json` - Added axios dependency
- `backend/.env.example` - Environment configuration

## Next Steps

1. Set up your `.env` file with M-Pesa credentials
2. Run the database update script
3. Start the server and test with sandbox credentials
4. Deploy to production when ready

