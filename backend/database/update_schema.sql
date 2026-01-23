-- Update schema for M-Pesa Daraja API Integration
-- Run this file after updating the backend code

-- Set timezone to Africa/Nairobi
SET timezone = 'Africa/Nairobi';

-- Create table for STK Push requests tracking
CREATE TABLE IF NOT EXISTS mpesa_stk_requests (
    id SERIAL PRIMARY KEY,
    checkout_request_id VARCHAR(100) UNIQUE NOT NULL,
    merchant_request_id VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    result_desc TEXT,
    raw_request JSONB,
    raw_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for STK requests
CREATE INDEX IF NOT EXISTS idx_mpesa_stk_checkout_id ON mpesa_stk_requests(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_stk_phone ON mpesa_stk_requests(phone);
CREATE INDEX IF NOT EXISTS idx_mpesa_stk_status ON mpesa_stk_requests(status);
CREATE INDEX IF NOT EXISTS idx_mpesa_stk_created_at ON mpesa_stk_requests(created_at);

-- Create table for B2C transactions (refunds/payments to customers)
CREATE TABLE IF NOT EXISTS mpesa_b2c_transactions (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(100) UNIQUE NOT NULL,
    initiator_id VARCHAR(100),
    originator_conversation_id VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    command_id VARCHAR(50) DEFAULT 'BusinessPayment',
    status VARCHAR(20) DEFAULT 'pending',
    result JSONB,
    result_desc TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for B2C transactions
CREATE INDEX IF NOT EXISTS idx_mpesa_b2c_conversation ON mpesa_b2c_transactions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_b2c_phone ON mpesa_b2c_transactions(phone);
CREATE INDEX IF NOT EXISTS idx_mpesa_b2c_status ON mpesa_b2c_transactions(status);
CREATE INDEX IF NOT EXISTS idx_mpesa_b2c_created_at ON mpesa_b2c_transactions(created_at);

-- Create table for transaction status queries
CREATE TABLE IF NOT EXISTS mpesa_status_queries (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(50) NOT NULL,
    conversation_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    result JSONB,
    result_desc TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mpesa_status_tx_id ON mpesa_status_queries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_status_conv_id ON mpesa_status_queries(conversation_id);

-- Create table for account balance queries
CREATE TABLE IF NOT EXISTS mpesa_balance_queries (
    id SERIAL PRIMARY KEY,
    status VARCHAR(20) DEFAULT 'pending',
    result JSONB,
    result_desc TEXT,
    balance DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verify the update
SELECT 'M-Pesa tables created successfully' as status;

-- List all mpesa-related tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'mpesa%'
ORDER BY table_name;

