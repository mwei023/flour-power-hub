import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable UUID extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Create users table for authentication
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('full_name').notNullable();
    table.string('role').defaultTo('user').notNullable().checkIn(['boss', 'attendant', 'admin', 'user']);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login_at');
    table.timestamps(true, true);
  });

  // Create API keys table for mobile authentication
  await knex.schema.createTable('api_keys', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('key_name').notNullable();
    table.string('key_hash').unique().notNullable();
    table.string('permissions').defaultTo('read');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('expires_at');
    table.timestamps(true, true);
  });

  // Create audit logs table for security
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action').notNullable();
    table.string('resource_type');
    table.string('resource_id');
    table.json('details');
    table.string('ip_address');
    table.string('user_agent');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['user_id', 'created_at']);
    table.index(['action', 'created_at']);
  });

  // Customers table
  await knex.schema.createTable('customers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('phone', 20);
    table.enu('type', ['walk-in', 'credit', 'tender']).notNullable();
    table.decimal('credit_balance', 10, 2).defaultTo(0.00);
    table.string('address');
    table.string('email');
    table.decimal('total_transactions', 10, 2).defaultTo(0.00);
    table.decimal('total_revenue', 10, 2).defaultTo(0.00);
    table.integer('transaction_count').defaultTo(0);
    table.timestamp('last_transaction_at');
    table.timestamps(true, true);
  });

  // Transactions table
  await knex.schema.createTable('transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('customer_id').references('id').inTable('customers').onDelete('SET NULL');
    table.string('customer_name').notNullable();
    table.enu('grain_type', ['maize', 'wheat', 'sorghum', 'millet']).notNullable();
    table.decimal('kilos', 8, 2).notNullable();
    table.integer('milling_count').notNullable();
    table.decimal('price_per_kilo', 8, 2).notNullable();
    table.decimal('total_price', 10, 2).notNullable();
    table.enu('payment_method', ['cash', 'mpesa', 'credit']).notNullable();
    table.enu('status', ['completed', 'pending', 'cancelled']).defaultTo('completed');
    table.text('notes');
    table.string('receipt_number').unique();
    table.string('processed_by');
    table.timestamp('completed_at');
    table.timestamps(true, true);
  });

  // Expenses table
  await knex.schema.createTable('expenses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.decimal('amount', 10, 2).notNullable();
    table.string('reason').notNullable();
    table.enu('category', ['food', 'repairs', 'electricity', 'supplies', 'other']).notNullable();
    table.text('description');
    table.string('receipt_number');
    table.string('vendor');
    table.enu('status', ['pending', 'approved', 'paid']).defaultTo('approved');
    table.string('approved_by');
    table.timestamps(true, true);
  });

  // Tenders table
  await knex.schema.createTable('tenders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('customer_id').references('id').inTable('customers').onDelete('CASCADE');
    table.string('customer_name').notNullable();
    table.string('organization').notNullable();
    table.enu('grain_type', ['maize', 'wheat', 'sorghum', 'millet']).notNullable();
    table.decimal('quantity', 10, 2).notNullable();
    table.enu('unit', ['kg', 'bags']).notNullable();
    table.decimal('agreed_price', 10, 2).notNullable();
    table.decimal('total_amount', 10, 2);
    table.enu('status', ['pending', 'picked-up', 'milled', 'delivered', 'paid']).defaultTo('pending');
    table.text('notes');
    table.date('due_date');
    table.string('contract_number').unique();
    table.string('contact_person');
    table.string('contact_phone');
    table.timestamp('picked_up_at');
    table.timestamp('milled_at');
    table.timestamp('delivered_at');
    table.timestamp('paid_at');
    table.timestamps(true, true);
  });

  // M-Pesa payments table for C2B notifications
  await knex.schema.createTable('mpesa_payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('transaction_id').unique().notNullable();
    table.string('phone', 20).notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('bill_ref');
    table.enu('status', ['pending', 'matched', 'failed']).defaultTo('pending');
    table.json('raw_data');
    table.uuid('matched_transaction_id').references('id').inTable('transactions').onDelete('SET NULL');
    table.timestamp('matched_at');
    table.timestamp('received_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    table.index(['transaction_id']);
    table.index(['phone']);
    table.index(['status']);
    table.index(['received_at']);
    table.index(['matched_transaction_id']);
  });

  // Settings table for app configuration
  await knex.schema.createTable('settings', (table) => {
    table.string('key').primary();
    table.text('value');
    table.string('type').defaultTo('string');
    table.text('description');
    table.boolean('is_public').defaultTo(false);
    table.timestamps(true, true);
  });

  // Create comprehensive indexes for performance optimization
  await knex.raw(`
    -- Customer indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_name ON customers(name);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_type ON customers(type);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_credit ON customers(credit_balance) WHERE credit_balance > 0;
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_last_transaction ON customers(last_transaction_at);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_revenue ON customers(total_revenue);
    
    -- Transaction indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_grain_type ON transactions(grain_type);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status ON transactions(status);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_customer_date ON transactions(customer_id, created_at);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_date_range ON transactions(created_at);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_receipt ON transactions(receipt_number);
    
    -- Expense indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_category ON expenses(category);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_category_date ON expenses(category, created_at);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_amount ON expenses(amount);
    
    -- Tender indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenders_status ON tenders(status);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenders_customer_id ON tenders(customer_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenders_due_date ON tenders(due_date);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenders_customer_status ON tenders(customer_id, status);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenders_organization ON tenders(organization);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenders_contract ON tenders(contract_number);
    
    -- Users indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON users(last_login_at);
    
    -- API keys indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
    
    -- Settings indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_settings_key ON settings(key);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_settings_public ON settings(is_public) WHERE is_public = true;
    
    -- M-Pesa payments indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mpesa_payments_transaction_id ON mpesa_payments(transaction_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mpesa_payments_phone ON mpesa_payments(phone);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mpesa_payments_status ON mpesa_payments(status);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mpesa_payments_received_at ON mpesa_payments(received_at);
  `);

// Insert default settings
  await knex('settings').insert([
    {
      key: 'app_name',
      value: 'Posho Mill Tracker',
      type: 'string',
      description: 'Application name',
      is_public: true,
    },
    {
      key: 'milling_rates',
      value: JSON.stringify({
        maize: 15.00,
        wheat: 20.00,
        sorghum: 18.00,
        millet: 22.00,
      }),
      type: 'json',
      description: 'Milling rates per kilo by grain type',
      is_public: false,
    },
    {
      key: 'default_credit_limit',
      value: '5000',
      type: 'number',
      description: 'Default credit limit for customers',
      is_public: false,
    },
    {
      key: 'enable_audit_logging',
      value: 'true',
      type: 'boolean',
      description: 'Enable audit logging for all actions',
      is_public: false,
    },
  ]);

  // Insert default users (admin and attendant)
  // Password hashes are bcrypt with 12 salt rounds
  // admin123 -> $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.Ey.1TnlI8zfuhe
  // attendant123 -> $2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
  await knex('users').insert([
    {
      email: 'admin@poshomill.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.Ey.1TnlI8zfuhe',
      full_name: 'Boss',
      role: 'admin',
    },
    {
      email: 'attendant@poshomill.com',
      password_hash: '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      full_name: 'Attendant',
      role: 'user',
    },
  ]).onConflict('email').ignore();

  console.log('✅ Database schema and indexes created successfully');
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('mpesa_payments');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('api_keys');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('settings');
  await knex.schema.dropTableIfExists('tenders');
  await knex.schema.dropTableIfExists('expenses');
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('customers');
  
  console.log('✅ Database schema dropped successfully');
}
