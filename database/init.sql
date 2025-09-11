-- Создание таблиц базы данных для музыкальной библиотеки

-- Таблица композиторов
CREATE TABLE IF NOT EXISTS composers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Таблица категорий произведений
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Таблица музыкальных произведений
CREATE TABLE IF NOT EXISTS works (
    id INT AUTO_INCREMENT PRIMARY KEY,
    composer_id INT NOT NULL,
    category_id INT NOT NULL,
    work_title VARCHAR(255) NOT NULL,
    subcategory VARCHAR(100),
    file_path VARCHAR(500),
    file_type ENUM('pdf', 'mp3', 'sib', 'mus') NOT NULL,
    file_size INT,
    thumbnail_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (composer_id) REFERENCES composers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_composer (composer_id),
    INDEX idx_category (category_id),
    INDEX idx_title (work_title),
    INDEX idx_file_type (file_type)
);

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Таблица коллекций
CREATE TABLE IF NOT EXISTS collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_name (name)
);

-- Таблица элементов коллекций
CREATE TABLE IF NOT EXISTS collection_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collection_id INT NOT NULL,
    work_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
    UNIQUE KEY unique_collection_work (collection_id, work_id),
    INDEX idx_collection (collection_id),
    INDEX idx_work (work_id)
);

-- Таблица музыкальных терминов
CREATE TABLE IF NOT EXISTS terms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    term VARCHAR(255) NOT NULL,
    definition TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_term (term)
);

-- Таблица файлов
CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_path VARCHAR(500) NOT NULL UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    file_size INT,
    file_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_path (file_path),
    INDEX idx_type (file_type)
);

-- Создание пользователя-администратора по умолчанию
-- Пароль: admin123 (должен быть изменен в production)
INSERT IGNORE INTO users (email, password_hash, name, is_active, is_admin) 
VALUES ('admin@musiclibrary.local', '$2b$10$8K1p/a0dhrxiowP.dnkgNORTWgdEDHn5L2/xjpEWuC.QQv4rKO9jO', 'admin', TRUE, TRUE);

-- Создание базовых категорий
INSERT IGNORE INTO categories (name) VALUES 
('Сольные произведения'),
('Ансамблевые произведения'),
('Оркестровые произведения'),
('Вокальные произведения'),
('Камерные произведения'),
('Этюды и упражнения'),
('Методические пособия');

-- Создание базовых композиторов
INSERT IGNORE INTO composers (name) VALUES 
('Моцарт, Вольфганг Амадей'),
('Бетховен, Людвиг ван'),
('Бах, Иоганн Себастьян'),
('Брамс, Иоганнес'),
('Гендель, Георг Фридрих'),
('Шуберт, Франц'),
('Шуман, Роберт'),
('Чайковский, Петр Ильич'),
('Римский-Корсаков, Николай'),
('Рахманинов, Сергей');