-- Music Library Database Initialization Script
-- This script sets up the basic database structure for Docker deployment

-- Create database if not exists (handled by Docker environment variables)
-- USE music_library;

-- Set character set and collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Create tables if they don't exist

-- Composers table
CREATE TABLE IF NOT EXISTS composers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birth_year INT,
    death_year INT,
    nationality VARCHAR(100),
    period VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_composer_name (name),
    INDEX idx_composer_period (period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Works table
CREATE TABLE IF NOT EXISTS works (
    id INT AUTO_INCREMENT PRIMARY KEY,
    composer_id INT NOT NULL,
    name VARCHAR(500) NOT NULL,
    opus VARCHAR(50),
    year_composed INT,
    key_signature VARCHAR(50),
    genre VARCHAR(100),
    duration_minutes INT,
    difficulty_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (composer_id) REFERENCES composers(id) ON DELETE CASCADE,
    INDEX idx_work_name (name),
    INDEX idx_work_composer (composer_id),
    INDEX idx_work_genre (genre),
    FULLTEXT idx_work_search (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories for file organization
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subcategories
CREATE TABLE IF NOT EXISTS subcategories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_subcategory_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sub-subcategories
CREATE TABLE IF NOT EXISTS subsubcategories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subcategory_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE,
    INDEX idx_subsubcategory_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Files table
CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    work_id INT NOT NULL,
    path VARCHAR(1000) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    file_type ENUM('PDF', 'MP3', 'WAV', 'FLAC', 'SIB', 'MUS', 'MIDI', 'ZIP', 'RAR', 'OTHER') NOT NULL,
    file_size BIGINT,
    category_id INT,
    subcategory_id INT,
    subsubcategory_id INT,
    description TEXT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
    FOREIGN KEY (subsubcategory_id) REFERENCES subsubcategories(id) ON DELETE SET NULL,
    INDEX idx_file_work (work_id),
    INDEX idx_file_type (file_type),
    INDEX idx_file_path (path(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Musical terms dictionary
CREATE TABLE IF NOT EXISTS terms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    term VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'ru',
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_term_name (term),
    INDEX idx_term_category (category),
    FULLTEXT idx_term_search (term, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role ENUM('user', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User collections
CREATE TABLE IF NOT EXISTS collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_collection_user (user_id),
    INDEX idx_collection_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Collection items (works in collections)
CREATE TABLE IF NOT EXISTS collection_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collection_id INT NOT NULL,
    work_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
    UNIQUE KEY unique_collection_work (collection_id, work_id),
    INDEX idx_collection_items_collection (collection_id),
    INDEX idx_collection_items_work (work_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thumbnails for PDF files
CREATE TABLE IF NOT EXISTS thumbnails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pdf_path VARCHAR(1000) NOT NULL,
    thumbnail_path VARCHAR(1000) NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_size INT,
    UNIQUE KEY unique_pdf_path (pdf_path(255)),
    INDEX idx_thumbnail_pdf (pdf_path(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bot usage statistics (optional)
CREATE TABLE IF NOT EXISTS bot_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL, -- Telegram user ID
    username VARCHAR(100),
    command VARCHAR(100) NOT NULL,
    query TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_time_ms INT,
    success BOOLEAN DEFAULT TRUE,
    INDEX idx_bot_stats_user (user_id),
    INDEX idx_bot_stats_command (command),
    INDEX idx_bot_stats_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample data
INSERT IGNORE INTO categories (name, description) VALUES
('Classical', 'Classical music compositions'),
('Romantic', 'Romantic period music'),
('Baroque', 'Baroque period music'),
('Modern', 'Modern and contemporary music'),
('Jazz', 'Jazz compositions'),
('Folk', 'Folk and traditional music');

INSERT IGNORE INTO terms (term, description, category) VALUES
('Аккорд', 'Одновременное звучание трех или более звуков разной высоты', 'Гармония'),
('Темп', 'Скорость исполнения музыкального произведения', 'Темп и ритм'),
('Тональность', 'Музыкальный лад, определяющий высотную организацию произведения', 'Теория музыки'),
('Форте', 'Громкое исполнение (динамический оттенок)', 'Динамика'),
('Пиано', 'Тихое исполнение (динамический оттенок)', 'Динамика'),
('Модуляция', 'Переход из одной тональности в другую', 'Гармония'),
('Каденция', 'Гармонический оборот, завершающий музыкальную фразу', 'Гармония'),
('Стаккато', 'Отрывистое исполнение звуков', 'Артикуляция'),
('Легато', 'Связное исполнение звуков', 'Артикуляция');

-- Sample composers
INSERT IGNORE INTO composers (name, birth_year, death_year, nationality, period) VALUES
('Johann Sebastian Bach', 1685, 1750, 'German', 'Baroque'),
('Wolfgang Amadeus Mozart', 1756, 1791, 'Austrian', 'Classical'),
('Ludwig van Beethoven', 1770, 1827, 'German', 'Classical/Romantic'),
('Frédéric Chopin', 1810, 1849, 'Polish', 'Romantic'),
('Пётр Ильич Чайковский', 1840, 1893, 'Russian', 'Romantic'),
('Claude Debussy', 1862, 1918, 'French', 'Impressionist'),
('Sergei Rachmaninoff', 1873, 1943, 'Russian', 'Late Romantic');

-- Create a sample admin user (password: admin123)
-- In production, this should be removed and proper user registration should be used
INSERT IGNORE INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@musiclibrary.com', '$2b$10$rOlnVzKgXCrZVgXzF8P0BOcBl8B8YJ8PXpMJxCq9rGJb9Kd7VQKVe', 'Admin', 'User', 'admin');

-- Create database views for easier querying
CREATE OR REPLACE VIEW work_details AS
SELECT 
    w.id as work_id,
    w.name as work_title,
    w.opus,
    w.year_composed,
    w.key_signature,
    w.genre,
    w.difficulty_level,
    c.name as composer_name,
    c.birth_year,
    c.death_year,
    c.nationality,
    c.period as composer_period,
    COUNT(f.id) as file_count
FROM works w
JOIN composers c ON w.composer_id = c.id
LEFT JOIN files f ON w.id = f.work_id
GROUP BY w.id, w.name, w.opus, w.year_composed, w.key_signature, w.genre, w.difficulty_level,
         c.name, c.birth_year, c.death_year, c.nationality, c.period;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_works_fulltext ON works(name);
CREATE INDEX IF NOT EXISTS idx_terms_fulltext ON terms(term, description);

-- Set up proper permissions
-- Note: In Docker, this is handled by environment variables
-- GRANT ALL PRIVILEGES ON music_library.* TO 'music_user'@'%';
-- FLUSH PRIVILEGES;

-- Optimize tables
OPTIMIZE TABLE composers, works, files, terms, users, collections, collection_items;

-- Show completion message
SELECT 'Music Library database initialized successfully!' as message;