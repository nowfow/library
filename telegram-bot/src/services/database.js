import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
});

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
export async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Execute a database query
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
export async function executeQuery(query, params = []) {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error(`Database query failed: ${error.message}`);
  }
}

/**
 * Get composers with work count
 * @returns {Promise<Array>} Composers list
 */
export async function getComposersWithCount() {
  const query = `
    SELECT c.name, COUNT(w.id) as work_count
    FROM composers c
    LEFT JOIN works w ON c.id = w.composer_id
    GROUP BY c.id, c.name
    ORDER BY c.name
  `;
  return executeQuery(query);
}

/**
 * Get works by composer ID
 * @param {number} composerId - Composer ID
 * @returns {Promise<Array>} Works list
 */
export async function getWorksByComposer(composerId) {
  const query = `
    SELECT w.id, w.name as title, c.name as composer
    FROM works w
    JOIN composers c ON w.composer_id = c.id
    WHERE c.id = ?
    ORDER BY w.name
  `;
  return executeQuery(query, [composerId]);
}

/**
 * Search works with flexible matching
 * @param {Object} params - Search parameters
 * @param {string} params.composer - Composer name
 * @param {string} params.work - Work title
 * @returns {Promise<Array>} Search results
 */
export async function searchWorksInDatabase({ composer, work }) {
  let query = `
    SELECT w.id AS work_id, w.name AS title, c.name AS composer, f.path AS pdf_path,
      categories.name AS category,
      subcategories.name AS subcategory,
      subsubcategories.name AS subsubcategory
    FROM works w
    JOIN composers c ON w.composer_id = c.id
    LEFT JOIN files f ON f.work_id = w.id
    LEFT JOIN categories ON f.category_id = categories.id
    LEFT JOIN subcategories ON f.subcategory_id = subcategories.id
    LEFT JOIN subsubcategories ON f.subsubcategory_id = subsubcategories.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (composer) {
    query += ' AND c.name LIKE ? COLLATE utf8mb4_unicode_ci';
    params.push(`%${composer}%`);
  }
  
  if (work) {
    query += ' AND w.name LIKE ? COLLATE utf8mb4_unicode_ci';
    params.push(`%${work}%`);
  }
  
  query += ' ORDER BY c.name, w.name';
  
  return executeQuery(query, params);
}

/**
 * Search musical terms
 * @param {string} searchTerm - Term to search
 * @returns {Promise<Array>} Terms list
 */
export async function searchTermsInDatabase(searchTerm) {
  const query = `
    SELECT term, description 
    FROM terms 
    WHERE term LIKE ? OR description LIKE ?
    ORDER BY term
  `;
  const searchPattern = `%${searchTerm}%`;
  return executeQuery(query, [searchPattern, searchPattern]);
}

/**
 * Get bot usage statistics
 * @returns {Promise<Object>} Usage stats
 */
export async function getBotStats() {
  try {
    const [composerCount] = await executeQuery('SELECT COUNT(*) as count FROM composers');
    const [workCount] = await executeQuery('SELECT COUNT(*) as count FROM works');
    const [termCount] = await executeQuery('SELECT COUNT(*) as count FROM terms');
    const [fileCount] = await executeQuery('SELECT COUNT(*) as count FROM files');
    
    return {
      composers: composerCount.count || 0,
      works: workCount.count || 0,
      terms: termCount.count || 0,
      files: fileCount.count || 0
    };
  } catch (error) {
    console.error('Error getting bot stats:', error);
    return {
      composers: 0,
      works: 0,
      terms: 0,
      files: 0
    };
  }
}

/**
 * Close database connection pool
 */
export async function closeDatabaseConnection() {
  try {
    await pool.end();
    console.log('✅ Database connection pool closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}

export default pool;