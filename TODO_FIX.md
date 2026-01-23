# TODO: Fix M-Pesa Transactions Display & Timezone Issues

## Issues Identified:
1. M-Pesa payments stored in `mpesa_payments` table but frontend reads from `transactions`
2. No API endpoint to fetch M-Pesa payments for frontend
3. No auto-creation of transaction records when M-Pesa payment received
4. Timezone mismatch - Database using wrong timezone (should be Africa/Nairobi = GMT+3)

## Tasks Completed:

### 1. ✅ Fix M-Pesa Controller (backend/src/controllers/mpesaController.ts)
- Auto-create transaction record when M-Pesa payment received
- Match payments to existing pending transactions by phone/amount
- Add status tracking for payment matching
- Add new endpoints to fetch M-Pesa payments

### 2. ✅ Create M-Pesa Routes (backend/src/routes/mpesaRoutes.ts)
- Add GET endpoint to fetch M-Pesa payments
- Add endpoint to fetch single M-Pesa payment
- Add endpoint for M-Pesa summary stats
- Add authentication middleware

### 3. ✅ Fix Timezone Configuration
- Set PostgreSQL timezone to Africa/Nairobi in database config
- Set Node.js timezone to Africa/Nairobi on connection
- Update database initialization scripts

### 4. ✅ Update Frontend API (src/lib/api.ts)
- Add mpesaApi to fetch M-Pesa payments
- Add M-Pesa payment types and mapper functions

### 5. ✅ Create M-Pesa Payments Page (src/pages/MpesaPayments.tsx)
- Created new page to display M-Pesa transactions
- Added filters for date range, status
- Display payment details with status indicators

### 6. ✅ Add M-Pesa Link to Navigation (src/pages/Settings.tsx)
- Added "M-Pesa Payments" link in Quick Actions section

### 7. ✅ Update App Routes (src/App.tsx)
- Added route for M-Pesa payments page (/mpesa)

### 8. ✅ Update Database Schema (backend/database/migrations/001_initial_schema.ts)
- Added matched_transaction_id column
- Added proper indexes

### 9. ✅ Create Update Script (backend/database/update_schema.sql)
- SQL script to update existing database

## Instructions to Apply Changes:

### Step 1: Update Database Schema
Run the update script in your PostgreSQL database:

```bash
psql -d poshomill -U mwei -h localhost -f backend/database/update_schema.sql
```

Or connect and run:
```sql
-- Add missing columns to mpesa_payments table
ALTER TABLE mpesa_payments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'failed'));
ALTER TABLE mpesa_payments ADD COLUMN IF NOT EXISTS raw_data JSONB;
ALTER TABLE mpesa_payments ADD COLUMN IF NOT EXISTS matched_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;
ALTER TABLE mpesa_payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE mpesa_payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Set timezone
SET timezone = 'Africa/Nairobi';
```

### Step 2: Restart Backend Server
```bash
cd backend && npm run dev
```

### Step 3: Rebuild Frontend (if needed)
```bash
npm run build
```

## What the Fixes Do:

1. **Auto-Create Transactions**: When M-Pesa payment is received, it now automatically creates a transaction record if no matching pending transaction is found

2. **Match Existing Transactions**: If a pending transaction exists with matching phone and amount, it will be marked as completed

3. **Display M-Pesa Payments**: Boss/Admin can now view all M-Pesa payments at /mpesa page

4. **Timezone Fix**: All timestamps now use Africa/Nairobi (GMT+3) timezone

