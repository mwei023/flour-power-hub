# Posho Mill Tracker - Backend Implementation Plan

## Overview
Create the Node.js + Express backend with PostgreSQL database to replace the current local storage system.

## Current State Analysis
- **Frontend**: Complete React app with TypeScript, using local storage
- **Data Models**: Well-defined interfaces in `src/types/index.ts`
- **Required Backend**: Node.js + Express + PostgreSQL (as per README)

## Implementation Plan

### Phase 1: Backend Setup & Database
1. **Backend Directory Structure**
   ```
   backend/
   ├── src/
   │   ├── controllers/     # Route handlers
   │   ├── models/          # Database queries
   │   ├── routes/          # API route definitions
   │   ├── middleware/      # Auth, validation, etc.
   │   ├── utils/           # Helper functions
   │   ├── config/          # Database and app config
   │   └── app.ts           # Express app setup
   ├── database/
   │   ├── migrations/      # Database schema changes
   │   ├── seeds/           # Sample data
   │   └── init.sql         # Initial database setup
   ├── .env.example         # Environment variables template
   ├── package.json         # Backend dependencies
   └── tsconfig.json        # TypeScript config
   ```

2. **Database Schema Design**
   - `customers` table (id, name, phone, type, credit_balance, created_at)
   - `transactions` table (id, customer_id, grain_type, kilos, milling_count, price_per_kilo, total_price, payment_method, status, notes, created_at)
   - `expenses` table (id, amount, reason, category, created_at)
   - `tenders` table (id, customer_id, organization, grain_type, quantity, unit, agreed_price, status, notes, created_at, due_date)

3. **Dependencies Setup**
   - Express.js for API framework
   - PostgreSQL with node-postgres (pg)
   - TypeScript for type safety
   - Zod for request validation
   - CORS for frontend integration
   - dotenv for environment variables

### Phase 2: API Endpoints Implementation
1. **Customer Endpoints**
   - GET /api/customers - List all customers
   - POST /api/customers - Create new customer
   - PUT /api/customers/:id - Update customer
   - DELETE /api/customers/:id - Delete customer
   - GET /api/customers/credit - Get customers with credit balance

2. **Transaction Endpoints**
   - GET /api/transactions - List transactions (with filters)
   - POST /api/transactions - Create new transaction
   - PUT /api/transactions/:id - Update transaction
   - DELETE /api/transactions/:id - Delete transaction
   - GET /api/transactions/today - Get today's transactions
   - GET /api/transactions/export - Export to CSV

3. **Expense Endpoints**
   - GET /api/expenses - List expenses
   - POST /api/expenses - Create new expense
   - PUT /api/expenses/:id - Update expense
   - DELETE /api/expenses/:id - Delete expense
   - GET /api/expenses/today - Get today's expenses

4. **Tender Endpoints**
   - GET /api/tenders - List tenders
   - POST /api/tenders - Create new tender
   - PUT /api/tenders/:id - Update tender status
   - DELETE /api/tenders/:id - Delete tender

5. **Reporting Endpoints**
   - GET /api/reports/daily - Daily summary report
   - GET /api/reports/date-range - Reports for date range
   - GET /api/reports/export - Export reports

### Phase 3: Integration & Migration
1. **Frontend API Integration**
   - Replace local storage calls with API calls
   - Add API client utilities
   - Implement error handling and loading states
   - Add offline sync capabilities

2. **Data Migration**
   - Create migration script to move data from local storage to PostgreSQL
   - Ensure data consistency during migration
   - Test migration process

3. **Environment Setup**
   - Docker configuration for easy deployment
   - Environment variables for database and API settings
   - Development vs production configurations

### Phase 4: Testing & Optimization
1. **API Testing**
   - Unit tests for controllers and models
   - Integration tests for API endpoints
   - Database connection tests

2. **Performance Optimization**
   - Database indexing for frequently queried fields
   - Query optimization
   - Caching strategies

3. **Security Implementation**
   - Input validation and sanitization
   - SQL injection prevention
   - CORS configuration

## Technical Implementation Details

### Database Schema
```sql
-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    type VARCHAR(20) NOT NULL CHECK (type IN ('walk-in', 'credit', 'tender')),
    credit_balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    grain_type VARCHAR(20) NOT NULL,
    kilos DECIMAL(8,2) NOT NULL,
    milling_count INTEGER NOT NULL,
    price_per_kilo DECIMAL(8,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_customers_type ON customers(type);
```

### API Response Format
```typescript
// Standard API response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination for list endpoints
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=poshomill
DB_USER=mwei
DB_PASSWORD=yourpassword

# API
PORT=3001
NODE_ENV=development

# M-Pesa (for future integration)
MPESA_TILL=9778129

# CORS
FRONTEND_URL=http://localhost:5173
```

## Migration Strategy
1. **Development Phase**: Run both local storage and API in parallel
2. **Data Export**: Create script to export existing local storage data
3. **Data Import**: Import exported data into PostgreSQL
4. **API Integration**: Switch frontend to use API calls
5. **Cleanup**: Remove local storage dependencies

## Estimated Implementation Time
- **Phase 1** (Backend Setup): ~2-3 hours
- **Phase 2** (API Implementation): ~4-5 hours
- **Phase 3** (Integration): ~3-4 hours
- **Phase 4** (Testing & Optimization): ~2-3 hours
- **Total**: ~11-15 hours

## Success Criteria
- ✅ All CRUD operations work via API
- ✅ Data migration successful from local storage
- ✅ Frontend seamlessly integrated with backend
- ✅ Reports and analytics work correctly
- ✅ Performance is acceptable for the use case
- ✅ Database schema supports all existing features

## Next Steps
1. Confirm this plan with user
2. Start with Phase 1 (Backend Setup)
3. Create database schema and initialization
4. Set up basic Express server
5. Implement core API endpoints
