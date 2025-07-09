import os
import pymysql
import hashlib
from PyPDF2 import PdfFileReader
import eyed3
import tempfile
import time
import csv
import sqlite3

# --- Параметры подключения к MySQL (SpaceWeb) ---
MYSQL_CONFIG = {
    'host': 'FVH1.spaceweb.ru',
    'user': 'nowfowmai4',
    'password': 'm8C09A54!',
    'database': 'nowfowmai4',
    'charset': 'utf8mb4',
    'autocommit': True
}

# --- Путь к локальной библиотеке ---
LIBRARY_ROOT = r'C:\Users\nowfo\Music\Валторна (2)\Валторна (1)'
LAST_PATH_FILE = 'last_indexed_path.txt'

# --- SQL для создания всей базы данных ---
CREATE_DB_SQL = '''
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE
);
CREATE TABLE IF NOT EXISTS subcategories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    category_id INT,
    UNIQUE KEY (name, category_id),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS subsubcategories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    subcategory_id INT,
    UNIQUE KEY (name, subcategory_id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS composers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE
);
CREATE TABLE IF NOT EXISTS works (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    composer_id INT,
    UNIQUE KEY (name, composer_id),
    FOREIGN KEY (composer_id) REFERENCES composers(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    path VARCHAR(512) UNIQUE,
    category_id INT,
    subcategory_id INT,
    subsubcategory_id INT,
    composer_id INT,
    work_id INT,
    file_type VARCHAR(16),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
    FOREIGN KEY (subsubcategory_id) REFERENCES subsubcategories(id) ON DELETE SET NULL,
    FOREIGN KEY (composer_id) REFERENCES composers(id) ON DELETE SET NULL,
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS terms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    term VARCHAR(255) UNIQUE,
    description TEXT
);
CREATE TABLE IF NOT EXISTS thumbnails (
    pdf_path VARCHAR(512) PRIMARY KEY,
    thumbnail_path VARCHAR(256) NOT NULL
);
'''

# Функция для вычисления хэш-суммы MD5
def compute_md5(file_path):
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

# Функция для извлечения метаданных из PDF
def extract_pdf_metadata(file_path):
    try:
        with open(file_path, 'rb') as f:
            reader = PdfFileReader(f)
            metadata = reader.getDocumentInfo()
            return metadata
    except Exception as e:
        return None

# Функция для извлечения метаданных из MP3
def extract_mp3_metadata(file_path):
    try:
        audio_file = eyed3.load(file_path)
        if audio_file.tag is None:
            return None
        metadata = {
            "artist": audio_file.tag.artist,
            "album": audio_file.tag.album,
            "title": audio_file.tag.title,
            "genre": audio_file.tag.genre,
            "year": audio_file.tag.recording_date
        }
        return metadata
    except Exception as e:
        return None

# Функция для извлечения метаданных из Sibelius и Finale
def extract_sib_mus_metadata(file_path):
    return None  # Для этих форматов не извлекаются метаданные

# Функция для извлечения метаданных в зависимости от формата
def extract_metadata(file_path):
    file_type = file_path.split('.')[-1].lower()
    
    if file_type == 'pdf':
        return extract_pdf_metadata(file_path)
    elif file_type == 'mp3':
        return extract_mp3_metadata(file_path)
    elif file_type == 'sib' or file_type == 'mus':
        return extract_sib_mus_metadata(file_path)
    else:
        return None  # Для других форматов возвращаем None

CATEGORY_RULES = {
    "Jazz": {"has_subcategory": False, "composer_idx": 1, "work_idx": 2},
    "Parts without piano": {"has_subcategory": False, "composer_idx": 1, "work_idx": 2},
    "SOLO": {"has_subcategory": False, "composer_idx": 1, "work_idx": 2},
    "Sonata": {"has_subcategory": False, "composer_idx": 1, "work_idx": 2},
    "Ансамбли валторн": {"has_subcategory": "custom"},
    "Крупная форма (Horn and Piano)": {"has_subcategory": False, "composer_idx": 1, "work_idx": 2},
    "Обучение": {"has_subcategory": True, "subcategory_idx": 1, "composer_idx": 2, "work_idx": 3, "special_subcategories": ["Хрестоматии"]},
    "Оркестровые трудности": {"has_subcategory": True, "subcategory_idx": 1, "composer_idx": 2, "work_idx": 3},
    "Охотничий рог (Hunting horn)": {"has_subcategory": False, "composer_idx": 1, "work_idx": 2},
    "Пьесы": {"has_subcategory": True, "subcategory_idx": 1, "composer_idx": 2, "work_idx": 3},
    "С духовым оркестром": {"has_subcategory": False, "composer_idx": 1, "work_idx": 2},
    "С оркестром": {"has_subcategory": False, "composer_idx": 1, "work_idx": 2},
}

# --- Кастомная логика для Обучение/Хрестоматии ---
def extract_metadata_from_path_webdav(file_path):
    file_path = file_path.replace("\\", "/")  # Привести к единому виду
    parts = file_path.strip("/").split("/")
    category = None
    subcategory = None
    subsubcategory = None
    composer = None
    work = None

    # --- Особые случаи для конкретных файлов ---
    if file_path.endswith('/Jazz/Jazz Duets.pdf'):
        category = 'Jazz'
        work = 'Jazz Duets'
        composer = None
        return category, None, None, composer, work
    if file_path.endswith('/Ансамбли валторн/Начальная школа ансамблевой игры для медных.pdf'):
        category = 'Ансамбли валторн'
        work = 'Начальная школа ансамблевой игры для медных'
        composer = None
        return category, None, None, composer, work
    if file_path.endswith('/Оркестровые трудности/Сборники/Probespietstellen für hohes und tiefes Horn.pdf'):
        category = 'Оркестровые трудности'
        subcategory = 'Сборники'
        work = 'Probespietstellen für hohes und tiefes Horn'
        composer = None
        return category, subcategory, None, composer, work
    # Обработка для файлов в Обучение/Школы, Методики
    tutor_files = [
        'The Compleat Tutor for the French Horn.pdf',
        'Young Horn Players Guide.pdf',
        'Начальная школа ансамблевой игры для медных.pdf',
        'Школа игры в дух. орк. Валторна.pdf',
        'Method for Horn.pdf',
        'New Instructions for the French Horn.pdf',
        'Technical Мanual Сomplete (2018).pdf',
        'The Coach Horn.pdf',
    ]
    for fname in tutor_files:
        if file_path.endswith(f'/Обучение/Школы, Методики/{fname}'):
            category = 'Обучение'
            subcategory = 'Школы, Методики'
            work = fname.rsplit('.', 1)[0]
            composer = None
            return category, subcategory, None, composer, work
    # Обработка для файлов в Обучение/Рефераты
    referat_files = [
        'Валторна в творчестве композиторов эпохи романтизма.pdf',
        'Развитие эмоциональной устойчивости(Кувычко М.Е).pdf',
    ]
    for fname in referat_files:
        if file_path.endswith(f'/Обучение/Рефераты/{fname}'):
            category = 'Обучение'
            subcategory = 'Рефераты'
            work = fname.rsplit('.', 1)[0]
            composer = None
            return category, subcategory, None, composer, work
    # Обработка для файлов в Обучение/Этюды, Упражнения
    etude_files = [
        'Scales-and-Arpeggios.pdf',
        'Abelson - Regimen.pdf',
        'Daily Exercises and Routines.pdf',
        'Scales and Arpeggios.pdf',
    ]
    for fname in etude_files:
        if file_path.endswith(f'/Обучение/Этюды, Упражнения/{fname}'):
            category = 'Обучение'
            subcategory = 'Этюды, Упражнения'
            work = fname.rsplit('.', 1)[0]
            composer = None
            return category, subcategory, None, composer, work

    for i, part in enumerate(parts):
        if part in CATEGORY_RULES:
            rule = CATEGORY_RULES[part]
            base = i
            if not rule.get("has_subcategory", False):
                category = part
                subcategory = None
                composer = parts[base + rule["composer_idx"]] if len(parts) > base + rule["composer_idx"] else None
                work = parts[base + rule["work_idx"]].rsplit('.', 1)[0] if len(parts) > base + rule["work_idx"] else None
                break
            # Универсальная логика: если после композитора идёт папка (work), а внутри неё файлы
            if len(parts) > base + 4:
                category = parts[base]
                subcategory = parts[base + 1]
                composer = parts[base + 2]
                work = parts[base + 3]  # Имя папки
                # (Логирование убрано по требованию)
            elif len(parts) > base + 3:
                category = parts[base]
                subcategory = parts[base + 1]
                composer = parts[base + 2]
                work = parts[base + 3].rsplit('.', 1)[0]
                # Логирование случая work=файл
                with open('work_file_log.txt', 'a', encoding='utf-8') as logf:
                    logf.write(f"FILE: category={category}, subcategory={subcategory}, subsubcategory={subsubcategory}, composer={composer}, work={work}, path={file_path}\n")
            else:
                # fallback: старая логика для особых случаев и коротких путей
                rule = CATEGORY_RULES[part]
                # --- кастомная логика для Ансамбли валторн ---
                if part == "Ансамбли валторн":
                    if len(parts) > base + 1:
                        subcat = parts[base + 1]
                        subcategory = subcat
                        # Подподкатегории для конкретных подкатегорий
                        allowed = {
                            '2': ['& Collection', '+Piano(Harp)(Orchestra)', 'EASY JAZZ DUETS+DISC', 'Сборник'],
                            '3': ['& Collection', '+Piano(Harp)(Orchestra)'],
                            '4': ['$Popular$', '&Colección&', '&Новый год&', '+Piano(Harp)(Orchestra)(Other)'],
                            '5': ['#Popular', '&Colección&'],
                            '6': ['#Popular'],
                            '8': ['+Other'],
                        }
                        if subcat in allowed and len(parts) > base + 2:
                            subsubcat_candidate = parts[base + 2]
                            if subsubcat_candidate in allowed[subcat]:
                                subsubcategory = subsubcat_candidate
                                composer = parts[base + 3] if len(parts) > base + 3 else None
                                work = parts[base + 4].rsplit(".", 1)[0] if len(parts) > base + 4 else None
                            else:
                                composer = parts[base + 2] if len(parts) > base + 2 else None
                                work = parts[base + 3].rsplit(".", 1)[0] if len(parts) > base + 3 else None
                        else:
                            composer = parts[base + 2] if len(parts) > base + 2 else None
                            work = parts[base + 3].rsplit(".", 1)[0] if len(parts) > base + 3 else None
                    break
                # --- кастомная логика для Обучение/Хрестоматии ---
                if part == "Обучение" and len(parts) > base + 1 and parts[base + 1] == "Хрестоматии":
                    subcategory = "Хрестоматии"
                    if len(parts) > base + 2:
                        composer = parts[base + 2]
                        # Если есть еще уровень (например, сборник или класс)
                        if len(parts) > base + 3:
                            work = parts[base + 3]
                            # Если work — это файл, то берем имя файла без расширения
                            if work.lower().endswith('.pdf') or work.lower().endswith('.mp3'):
                                work = work.rsplit('.', 1)[0]
                        else:
                            work = None
                    break
                # --- стандартная логика ---
                elif rule.get("has_subcategory") == True:
                    sub_idx = base + rule["subcategory_idx"]
                    comp_idx = base + rule["composer_idx"]
                    work_idx = base + rule["work_idx"]
                    subcategory = parts[sub_idx] if len(parts) > sub_idx else None
                    composer = parts[comp_idx] if len(parts) > comp_idx else None
                    if len(parts) > work_idx:
                        work = parts[work_idx].rsplit(".", 1)[0]
                    elif len(parts) > sub_idx and (parts[-1].lower().endswith('.pdf') or parts[-1].lower().endswith('.mp3')):
                        composer = None
                        work = parts[-1].rsplit('.', 1)[0]
                    elif len(parts) == sub_idx + 2 and (parts[-1].lower().endswith('.pdf') or parts[-1].lower().endswith('.mp3')):
                        composer = None
                        work = parts[-1].rsplit('.', 1)[0]
                    elif len(parts) == base + 2 and (parts[-1].lower().endswith('.pdf') or parts[-1].lower().endswith('.mp3')):
                        subcategory = None
                        composer = None
                        work = parts[-1].rsplit('.', 1)[0]
                    else:
                        work = None
                else:
                    comp_idx = base + rule["composer_idx"]
                    work_idx = base + rule["work_idx"]
                    composer = parts[comp_idx] if len(parts) > comp_idx else None
                    if len(parts) > work_idx:
                        work = parts[work_idx].rsplit(".", 1)[0]
                    elif len(parts) == base + 2 and (parts[-1].lower().endswith('.pdf') or parts[-1].lower().endswith('.mp3')):
                        composer = None
                        work = parts[-1].rsplit('.', 1)[0]
                    else:
                        work = None
            break
        elif part == "Пьесы":
            base = i
            # Новый блок: если work — это папка, а не файл
            if len(parts) > base + 4:
                # Пример: Пьесы/Зарубежных композиторов/Strauss Franz/Op.7 Nocturno/Horn.Piano.pdf
                subcategory = parts[base + 1]
                composer = parts[base + 2]
                work = parts[base + 3]  # Имя папки
            elif len(parts) > base + 3:
                # Пример: Пьесы/Зарубежных композиторов/Strauss Franz/Op.7 Nocturno.pdf
                subcategory = parts[base + 1]
                composer = parts[base + 2]
                work = parts[base + 3].rsplit('.', 1)[0]
            break
        elif part == "Parts without piano":
            base = i
            if len(parts) > base + 1:
                subcat = parts[base + 1]
                special = [
                    '12 Piezas',
                    'С цифровкой',
                    'Избрани пиеси за валдхорна и пиано (II) София',
                ]
                if subcat in special:
                    composer = None
                    work = subcat
                else:
                    composer = parts[base + 2] if len(parts) > base + 2 else None
                    work = parts[base + 3].rsplit('.', 1)[0] if len(parts) > base + 3 else None
            break
        elif part == "Jazz":
            base = i
            if len(parts) > base + 1:
                subcat = parts[base + 1]
                if subcat == 'EASY JAZZ DUETS+DISC':
                    composer = None
                    work = subcat
                else:
                    composer = parts[base + 2] if len(parts) > base + 2 else None
                    work = parts[base + 3].rsplit('.', 1)[0] if len(parts) > base + 3 else None
            break
        elif part == "Оркестровые трудности":
            base = i
            if len(parts) > base + 1:
                subcat = parts[base + 1]
                subcategory = subcat
                if subcat == 'Сборники' and len(parts) > base + 2:
                    composer = None
                    work = parts[base + 2].rsplit('.', 1)[0]
                else:
                    composer = parts[base + 2] if len(parts) > base + 2 else None
                    work = parts[base + 3].rsplit('.', 1)[0] if len(parts) > base + 3 else None
            break
        elif part == "Обучение":
            base = i
            if len(parts) > base + 1:
                subcat = parts[base + 1]
                subcategory = subcat
                if subcat == 'Статьи о валторне и валторнистах' and len(parts) > base + 2:
                    composer = None
                    work = parts[base + 2].rsplit('.', 1)[0]
                elif subcat == 'Этюды, Упражнения' and len(parts) > base + 2 and parts[base + 2] == 'Различные упражнения':
                    subsubcategory = 'Различные упражнения'
                    composer = parts[base + 3] if len(parts) > base + 3 else None
                    work = parts[base + 4].rsplit('.', 1)[0] if len(parts) > base + 4 else None
                else:
                    composer = parts[base + 2] if len(parts) > base + 2 else None
                    work = parts[base + 3].rsplit('.', 1)[0] if len(parts) > base + 3 else None
            break
    # Если категория определена, но work всё ещё не определён, и последний элемент — файл
    if category and (work is None) and (parts[-1].lower().endswith('.pdf') or parts[-1].lower().endswith('.mp3')):
        work = parts[-1].rsplit('.', 1)[0]
    # --- Новое: если composer или work не определены, явно ставим 'Unknown' ---
    if composer is None or composer == '':
        composer = 'Unknown'
    if work is None or work == '':
        work = 'Unknown'
    return category, subcategory, subsubcategory, composer, work

# --- Импорт терминов из terms.csv ---
def import_terms_from_csv(conn, csv_path='terms.csv'):
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM terms')
    count = cursor.fetchone()[0]
    if count > 0:
        print("Термины уже импортированы в базу данных.")
        return
    try:
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            terms = [(row['term'], row['description']) for row in reader]
        # Проверяем дубликаты по term
        seen = set()
        duplicates = set()
        for term, _ in terms:
            if term in seen:
                duplicates.add(term)
            else:
                seen.add(term)
        if duplicates:
            with open('error_terms.txt', 'a', encoding='utf-8') as errf:
                for term in duplicates:
                    errf.write(f"Дубликат термина: {term}\n")
        cursor.executemany('INSERT IGNORE INTO terms (term, description) VALUES (%s, %s)', terms)
        print(f"Импортировано терминов: {len(terms) - len(duplicates)} (дубликатов: {len(duplicates)})")
    except Exception as e:
        print(f"Ошибка при импорте терминов: {e}")

def log_warning(message):
    print(message)
    with open('index_warnings.log', 'a', encoding='utf-8') as log_file:
        log_file.write(message + '\n')

USE_SQLITE = False  # True — использовать только SQLite, False — только MySQL
SQLITE_DB_PATH = 'local_index.db'

def init_sqlite_db():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE
        );
        CREATE TABLE IF NOT EXISTS subcategories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            category_id INTEGER,
            UNIQUE(name, category_id)
        );
        CREATE TABLE IF NOT EXISTS subsubcategories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            subcategory_id INTEGER,
            UNIQUE(name, subcategory_id)
        );
        CREATE TABLE IF NOT EXISTS composers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE
        );
        CREATE TABLE IF NOT EXISTS works (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            composer_id INTEGER,
            UNIQUE(name, composer_id)
        );
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT UNIQUE,
            category_id INTEGER,
            subcategory_id INTEGER,
            subsubcategory_id INTEGER,
            composer_id INTEGER,
            work_id INTEGER,
            file_type TEXT
        );
        CREATE TABLE IF NOT EXISTS terms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            term TEXT UNIQUE,
            description TEXT
        );
        CREATE TABLE IF NOT EXISTS thumbnails (
            pdf_path TEXT PRIMARY KEY,
            thumbnail_path TEXT NOT NULL
        );
    ''')
    conn.commit()
    conn.close()

def index_file_sqlite(path, category, subcategory, subsubcategory, composer, work, file_type):
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    # Категория
    cursor.execute('INSERT OR IGNORE INTO categories (name) VALUES (?)', (category,))
    cursor.execute('SELECT id FROM categories WHERE name = ?', (category,))
    category_id = cursor.fetchone()[0] if category else None

    # Определяем, нужна ли подкатегория
    has_subcategory = CATEGORY_RULES.get(category, {}).get("has_subcategory", False)
    if has_subcategory:
        cursor.execute('INSERT OR IGNORE INTO subcategories (name, category_id) VALUES (?, ?)', (subcategory, category_id))
        cursor.execute('SELECT id FROM subcategories WHERE name = ?', (subcategory,))
        subcategory_id = cursor.fetchone()[0] if subcategory else None
    else:
        subcategory_id = None

    # Подподкатегория
    cursor.execute('INSERT OR IGNORE INTO subsubcategories (name, subcategory_id) VALUES (?, ?)', (subsubcategory, subcategory_id))
    cursor.execute('SELECT id FROM subsubcategories WHERE name = ?', (subsubcategory,))
    subsubcategory_id = cursor.fetchone()[0] if subsubcategory else None

    # Композитор
    cursor.execute('INSERT OR IGNORE INTO composers (name) VALUES (?)', (composer,))
    cursor.execute('SELECT id FROM composers WHERE name = ?', (composer,))
    composer_id = cursor.fetchone()[0] if composer else None

    # Произведение
    cursor.execute('INSERT OR IGNORE INTO works (name, composer_id) VALUES (?, ?)', (work, composer_id))
    cursor.execute('SELECT id FROM works WHERE name = ? AND composer_id = ?', (work, composer_id))
    work_id = cursor.fetchone()[0] if work and composer_id else None

    # Файл
    cursor.execute('''
        INSERT OR IGNORE INTO files (path, category_id, subcategory_id, subsubcategory_id, composer_id, work_id, file_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (path, category_id, subcategory_id, subsubcategory_id, composer_id, work_id, file_type))
    conn.commit()
    conn.close()

def index_file(file_path, conn, cursor, remote_path=None, file_counter=None):
    try:
        category, subcategory, subsubcategory, composer, work = extract_metadata_from_path_webdav(remote_path)
        file_type = remote_path.split('.')[-1].lower()
        if USE_SQLITE:
            index_file_sqlite(remote_path, category, subcategory, subsubcategory, composer, work, file_type)
            print(f"[SQLite] Файл успешно проиндексирован: {remote_path}")
            return
        if not category:
            log_warning(f"WARNING: Не удалось определить category для файла: {remote_path}")
        if composer == 'Unknown':
            pass
        if work == 'Unknown':
            pass
        cursor.execute("INSERT IGNORE INTO categories (name) VALUES (%s)", (category,))
        cursor.execute("INSERT IGNORE INTO subcategories (name, category_id) VALUES (%s, (SELECT id FROM categories WHERE name = %s))", (subcategory, category))
        cursor.execute("INSERT IGNORE INTO subsubcategories (name, subcategory_id) VALUES (%s, (SELECT id FROM subcategories WHERE name = %s))", (subsubcategory, subcategory))
        cursor.execute("INSERT IGNORE INTO composers (name) VALUES (%s)", (composer,))
        cursor.execute("INSERT IGNORE INTO works (name, composer_id) VALUES (%s, (SELECT id FROM composers WHERE name = %s))", (work, composer))
        cursor.execute("SELECT id FROM categories WHERE name = %s", (category,))
        category_row = cursor.fetchone()
        category_id = category_row[0] if category_row else None
        if category_id is None:
            log_warning(f"WARNING: Не найден category_id для '{category}' (файл: {remote_path})")
        cursor.execute("SELECT id FROM subcategories WHERE name = %s", (subcategory,))
        subcategory_row = cursor.fetchone()
        subcategory_id = subcategory_row[0] if subcategory_row else None
        if subcategory and subcategory_id is None:
            log_warning(f"WARNING: Не найден subcategory_id для '{subcategory}' (файл: {remote_path})")
        cursor.execute("SELECT id FROM subsubcategories WHERE name = %s", (subsubcategory,))
        subsubcategory_row = cursor.fetchone()
        subsubcategory_id = subsubcategory_row[0] if subsubcategory_row else None
        cursor.execute("SELECT id FROM composers WHERE name = %s", (composer,))
        composer_row = cursor.fetchone()
        composer_id = composer_row[0] if composer_row else None
        if composer and composer_id is None:
            log_warning(f"WARNING: Не найден composer_id для '{composer}' (файл: {remote_path})")
        work_id = None
        if work and composer_id:
            cursor.execute("SELECT id FROM works WHERE name = %s AND composer_id = %s", (work, composer_id))
            work_row = cursor.fetchone()
            work_id = work_row[0] if work_row else None
            if work_id is None:
                log_warning(f"WARNING: Не найден work_id для '{work}' (composer_id: {composer_id}) (файл: {remote_path})")
        cursor.execute('''
            INSERT INTO files (path, category_id, subcategory_id, subsubcategory_id, composer_id, work_id, file_type)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', (remote_path, category_id, subcategory_id, subsubcategory_id, composer_id, work_id, file_type))
        print(f"Файл успешно проиндексирован (по имени): {remote_path}")
        print(f"  → category:     {category} (таблица categories)")
        print(f"  → subcategory:  {subcategory} (таблица subcategories)")
        print(f"  → subsubcategory: {subsubcategory} (таблица subsubcategories)")
        print(f"  → composer:     {composer} (таблица composers)")
        print(f"  → work:         {work} (таблица works)")
    except Exception as e:
        with open('error_index.txt', 'a', encoding='utf-8') as errf:
            errf.write(f"{remote_path}: {e}\n")
        print(f"ОШИБКА при обработке {remote_path}: {e}")

def process_local_files(root_dir, conn, cursor, file_counter={'found': 0, 'indexed': 0}):
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Проверяем, является ли текущая папка папкой произведения (work)
        if filenames:
            # Получаем относительный путь work
            rel_dir = os.path.relpath(dirpath, root_dir)
            rel_dir = '/' + rel_dir.replace('\\', '/')
            # Индексируем все файлы внутри папки
            for filename in filenames:
                abs_path = os.path.join(dirpath, filename)
                rel_path = rel_dir + '/' + filename
                index_file(abs_path, conn, cursor, rel_path, file_counter)
            # После индексации всех файлов внутри work — логируем
            if filenames:
                # Получаем метаданные по первому файлу (они одинаковые для всех файлов внутри work)
                category, subcategory, subsubcategory, composer, work = extract_metadata_from_path_webdav(rel_dir + '/' + filenames[0])
                with open('index_summary.log', 'a', encoding='utf-8') as logf:
                    logf.write(f"[OK] category={category}, subcategory={subcategory}, subsubcategory={subsubcategory}, composer={composer}, work={work}, files_count={len(filenames)}\n")
            save_last_path(rel_dir)
        file_counter['indexed'] += 1
        file_counter['found'] += 1
        print(f"Индексировано файлов: {file_counter['indexed']} из {file_counter['found']}")

def save_last_path(path):
    with open(LAST_PATH_FILE, 'w', encoding='utf-8') as f:
        f.write(path)

def load_last_path():
    if os.path.exists(LAST_PATH_FILE):
        with open(LAST_PATH_FILE, 'r', encoding='utf-8') as f:
            return f.read().strip()
    return None

def import_thumbnails_from_csv(conn, csv_path='thumbnails.csv'):
    cursor = conn.cursor()
    try:
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            rows = [(row['pdf_path'], row['thumbnail_path']) for row in reader]
        cursor.execute('CREATE TABLE IF NOT EXISTS thumbnails (pdf_path VARCHAR(512) PRIMARY KEY, thumbnail_path VARCHAR(256) NOT NULL)')
        cursor.executemany('REPLACE INTO thumbnails (pdf_path, thumbnail_path) VALUES (%s, %s)', rows)
        print(f"Импортировано миниатюр: {len(rows)}")
    except Exception as e:
        print(f"Ошибка при импорте миниатюр: {e}")

if __name__ == "__main__":
    db_connected = False
    conn = None
    cursor = None
    while not db_connected:
        try:
            conn = pymysql.connect(**MYSQL_CONFIG)
            cursor = conn.cursor()
            # Создаём все таблицы, если их нет
            for statement in CREATE_DB_SQL.split(';'):
                if statement.strip():
                    cursor.execute(statement)
            import_thumbnails_from_csv(conn, 'thumbnails.csv')
            import_terms_from_csv(conn, 'terms.csv')
            db_connected = True
        except Exception as e:
            print(f"WARNING: Не удалось подключиться к базе данных: {e}. Повтор через 5 секунд...")
            time.sleep(5)
    print("Подключение к базе данных MySQL установлено.")
    init_sqlite_db() # Инициализируем SQLite
    # Продолжаем с последнего места
    start_path = load_last_path() or '/'
    print(f"Индексирование начинается с: {start_path}")
    process_local_files(LIBRARY_ROOT, conn, cursor)
    print("Индексирование завершено!")
    # Сохраняем количество проиндексированных файлов в success.txt
    indexed_count = file_counter['indexed'] if 'file_counter' in locals() else 0
    with open('success.txt', 'w', encoding='utf-8') as f:
        f.write(f'Индексирование завершено успешно.\nПроиндексировано файлов: {indexed_count}')
    conn.close()