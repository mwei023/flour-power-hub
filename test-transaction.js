const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'poshomill',
  user: process.env.DB_USER || 'mwei',
  password: process.env.DB_PASSWORD || 'poshomill123',
});

async function createTestTransaction() {
  try {
    console.log('Connecting to database...');

    // Test transaction data: 18 kgs maize-2, cash payment, walk-in customer
    const transactionData = {
      customer_name: 'Walk-in Customer',
      grain_type: 'maize', // Backend stores as 'maize' for both maize-1 and maize-2
      kilos: 18,
      milling_count: 1, // maize-2 is single milling
      price_per_kilo: 5, // KSh 5/kg for maize-2
      total_price: 90, // 18 * 5 = 90
      payment_method: 'cash',
      status: 'completed',
      receipt_number: `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };

    console.log('Inserting transaction:', transactionData);

    const result = await pool.query(
      `INSERT INTO transactions
        (customer_name, grain_type, kilos, milling_count, price_per_kilo, total_price, payment_method, status, receipt_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        transactionData.customer_name,
        transactionData.grain_type,
        transactionData.kilos,
        transactionData.milling_count,
        transactionData.price_per_kilo,
        transactionData.total_price,
        transactionData.payment_method,
        transactionData.status,
        transactionData.receipt_number
      ]
    );

    console.log('✅ Transaction created successfully!');
    console.log('Transaction details:', result.rows[0]);

    // Verify the transaction exists
    const verifyResult = await pool.query(
      'SELECT COUNT(*) as count FROM transactions WHERE receipt_number = $1',
      [transactionData.receipt_number]
    );

    console.log(`✅ Verification: ${verifyResult.rows[0].count} transaction(s) found in database`);

    return result.rows[0];

  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the test
createTestTransaction()
  .then(() => {
    console.log('🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
