import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Конфигурация пула соединений
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'music_library',
  charset: 'utf8mb4',
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  timezone: '+00:00',
  ssl: {
    rejectUnauthorized: false
  }
};

// Создание пула соединений
export const pool = mysql.createPool(poolConfig);

// Функция тестирования соединения с базой данных
export async function testDatabaseConnection(maxRetries = 5, delay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Попытка подключения к БД ${attempt}/${maxRetries}...`);
      
      const [rows] = await pool.query('SELECT 1 as test');
      
      if (rows[0]?.test === 1) {
        console.log('✅ Соединение с базой данных успешно установлено');
        console.log(`📊 База данных: ${poolConfig.database}@${poolConfig.host}:${poolConfig.port}`);
        return true;
      }
    } catch (error) {
      console.error(`❌ Попытка ${attempt}/${maxRetries} не удалась:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Не удалось подключиться к базе данных после ${maxRetries} попыток: ${error.message}`);
      }
      
      console.log(`⏳ Ожидание ${delay/1000} секунд перед следующей попыткой...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Увеличиваем задержку с каждой попыткой
      delay = Math.min(delay * 1.5, 10000);
    }
  }
  
  return false;
}

// Функция для выполнения запросов с обработкой ошибок
export async function executeQuery(query, params = []) {
  try {
    console.log(`🔍 Выполнение запроса: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('❌ Ошибка выполнения запроса:', {
      query: query.substring(0, 200),
      params,
      error: error.message
    });
    throw error;
  }
}

// Функция для получения информации о подключении
export async function getDatabaseInfo() {
  try {
    const [serverInfo] = await pool.query('SELECT VERSION() as version');
    const [dbInfo] = await pool.query('SELECT DATABASE() as database');
    const [charsetInfo] = await pool.query('SELECT @@character_set_database as charset');
    
    return {
      version: serverInfo[0]?.version,
      database: dbInfo[0]?.database,
      charset: charsetInfo[0]?.charset,
      host: poolConfig.host,
      port: poolConfig.port
    };
  } catch (error) {
    console.error('❌ Ошибка получения информации о БД:', error.message);
    throw error;
  }
}

// Функция для создания таблиц (будет вызываться при инициализации)
export async function initializeTables() {
  try {
    console.log('🔧 Инициализация таблиц базы данных...');
    
    // Таблица терминов
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS terms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        term VARCHAR(255) NOT NULL,
        definition TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_term (term)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    
    // Таблица произведений
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS works (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(255) NOT NULL,
        subcategory VARCHAR(255) DEFAULT NULL,
        composer VARCHAR(255) NOT NULL,
        work_title VARCHAR(500) NOT NULL,
        file_path TEXT NOT NULL,
        file_type ENUM('pdf', 'mp3', 'sib', 'mus', 'other') DEFAULT 'pdf',
        file_size BIGINT DEFAULT NULL,
        pages_count INT DEFAULT NULL,
        thumbnail_path VARCHAR(500) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_composer (composer),
        INDEX idx_work_title (work_title),
        INDEX idx_file_type (file_type),
        INDEX idx_thumbnail (thumbnail_path),
        FULLTEXT(composer, work_title, category, subcategory)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    
    // Таблица пользователей
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) DEFAULT NULL,
        name VARCHAR(255) NOT NULL,
        google_id VARCHAR(255) DEFAULT NULL UNIQUE,
        role ENUM('user', 'admin') DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_google_id (google_id),
        INDEX idx_role (role)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    
    // Таблица коллекций пользователей
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS user_collections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_public (is_public)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    
    // Таблица связи коллекций с произведениями
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS collection_works (
        id INT AUTO_INCREMENT PRIMARY KEY,
        collection_id INT NOT NULL,
        work_id INT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collection_id) REFERENCES user_collections(id) ON DELETE CASCADE,
        FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
        UNIQUE KEY unique_collection_work (collection_id, work_id),
        INDEX idx_collection_id (collection_id),
        INDEX idx_work_id (work_id)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    
    console.log('✅ Таблицы базы данных успешно инициализированы');
  } catch (error) {
    console.error('❌ Ошибка инициализации таблиц:', error.message);
    throw error;
  }
}

// Graceful shutdown для пула соединений
process.on('SIGINT', async () => {
  console.log('🛑 Закрытие пула соединений с БД...');
  await pool.end();
});

process.on('SIGTERM', async () => {
  console.log('🛑 Закрытие пула соединений с БД...');
  await pool.end();
});