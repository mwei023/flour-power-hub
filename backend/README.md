# Posho Mill Tracker - Backend API

A robust Node.js + Express + PostgreSQL backend API for the Posho Mill Tracker application.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose (optional, for PostgreSQL)
- PostgreSQL 14+ (if not using Docker)

### Option 1: With Docker (Recommended)

1. **Start the entire stack:**
   ```bash
   docker-compose up -d
   ```

2. **Access the services:**
   - API: http://localhost:3001
   - Database: localhost:5432 (user: mwei, password: poshomill123, database: poshomill)

### Option 2: Manual Setup

1. **Set up PostgreSQL database:**
   ```bash
   # Create database
   createdb poshomill
   
   # Run initialization script
   psql poshomill -f backend/database/init.sql
   ```

2. **Configure environment:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Install and start:**
   ```bash
   npm install
   npm run dev
   ```

## 📚 API Documentation

Base URL: `http://localhost:3001/api/v1`

### Health Check
```http
GET /health
```

### Customers
```http
GET    /customers              # List all customers
GET    /customers/:id          # Get customer by ID
GET    /customers/credit       # Get customers with credit balance
POST   /customers              # Create new customer
PUT    /customers/:id          # Update customer
DELETE /customers/:id          # Delete customer
```

### Transactions
```http
GET    /transactions           # List all transactions
GET    /transactions/today     # Get today's transactions
GET    /transactions/:id       # Get transaction by ID
POST   /transactions           # Create new transaction
PUT    /transactions/:id       # Update transaction
DELETE /transactions/:id       # Delete transaction
GET    /transactions/export    # Export transactions (CSV)
```

### Expenses
```http
GET    /expenses              # List all expenses
GET    /expenses/today        # Get today's expenses
GET    /expenses/:id          # Get expense by ID
POST   /expenses              # Create new expense
PUT    /expenses/:id          # Update expense
DELETE /expenses/:id          # Delete expense
```

### Tenders
```http
GET    /tenders               # List all tenders
GET    /tenders/:id           # Get tender by ID
POST   /tenders               # Create new tender
PUT    /tenders/:id           # Update tender
DELETE /tenders/:id           # Delete tender
```

### Reports
```http
GET /reports/daily            # Daily summary report
GET /reports/date-range       # Date range summary
GET /reports/export           # Export daily report
```

## 🏗️ Architecture

```
backend/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── customerController.ts
│   │   ├── transactionController.ts
│   │   ├── expenseController.ts
│   │   ├── tenderController.ts
│   │   └── reportController.ts
│   ├── routes/              # Route definitions
│   │   ├── customerRoutes.ts
│   │   ├── transactionRoutes.ts
│   │   ├── expenseRoutes.ts
│   │   ├── tenderRoutes.ts
│   │   └── reportRoutes.ts
│   ├── middleware/          # Custom middleware
│   │   └── validation.ts
│   ├── config/              # Configuration
│   │   └── database.ts
│   ├── types/               # TypeScript interfaces
│   │   └── index.ts
│   └── app.ts               # Express app setup
├── database/
│   ├── init.sql             # Database schema
│   ├── migrations/          # Migration files
│   └── seeds/               # Sample data
├── .env.example             # Environment template
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
└── Dockerfile              # Docker config
```

## 📊 Database Schema

### Tables
- **customers**: Customer information and credit balances
- **transactions**: Milling transactions and payments
- **expenses**: Daily expenses and categories
- **tenders**: School/church contract management

### Key Features
- UUID primary keys
- Automatic timestamps (created_at, updated_at)
- Foreign key relationships
- Performance indexes
- Data validation constraints

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm run db:setup     # Initialize database
npm run db:migrate   # Run migrations
npm run db:seed      # Load sample data
```

### Environment Variables
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=poshomill
DB_USER=mwei
DB_PASSWORD=yourpassword
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Adding New Features

1. **Create Controller** (`src/controllers/featureController.ts`):
   ```typescript
   export const createFeature = asyncHandler(async (req: Request, res: Response) => {
     // Implementation
   });
   ```

2. **Add Routes** (`src/routes/featureRoutes.ts`):
   ```typescript
   router.post('/', createFeature);
   ```

3. **Update Types** (`src/types/index.ts`):
   ```typescript
   export interface Feature {
     id: string;
     // Add fields
   }
   ```

4. **Add Validation** (`src/middleware/validation.ts`):
   ```typescript
   export const featureSchema = z.object({
     // Add validation rules
   });
   ```

## 🧪 Testing

### API Testing
```bash
# Health check
curl http://localhost:3001/health

# Test customers endpoint
curl http://localhost:3001/api/v1/customers

# Create customer
curl -X POST http://localhost:3001/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","type":"credit","phone":"+254712345678"}'
```

### Database Testing
```bash
# Connect to PostgreSQL
docker exec -it poshomill-postgres psql -U mwei -d poshomill

# Check tables
\\dt

# Query customers
SELECT * FROM customers LIMIT 5;
```

## 🚢 Deployment

### Docker Production
```bash
# Build and run production containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Manual Production
```bash
# Build the application
npm run build

# Set production environment
export NODE_ENV=production
export DB_HOST=your-prod-db-host
export DB_PASSWORD=your-secure-password

# Start server
npm start
```

## 📈 Performance

### Database Optimization
- Indexed columns: created_at, customer_id, status
- Connection pooling: max 20 connections
- Query optimization for common operations

### API Optimization
- Gzip compression
- Rate limiting
- CORS configuration
- Request validation

## 🔒 Security

- Input validation with Zod schemas
- SQL injection prevention with parameterized queries
- CORS protection
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers

## 🐛 Troubleshooting

### Common Issues

1. **Database connection failed:**
   - Check PostgreSQL is running
   - Verify credentials in .env
   - Ensure database exists

2. **Port already in use:**
   ```bash
   lsof -ti:3001 | xargs kill -9
   ```

3. **TypeScript errors:**
   ```bash
   npm run build
   ```

4. **Docker issues:**
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

### Logs
```bash
# Backend logs
docker-compose logs backend

# Database logs
docker-compose logs postgres
```

## 📞 Support

- **API Documentation**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Database Admin**: psql -h localhost -p 5432 -U mwei -d poshomill

---

**Built for Kenyan Posho Mill entrepreneurs** 🌍

*"From maize to margin — track every kernel, credit, and kilo."*
