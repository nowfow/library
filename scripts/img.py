import os
import csv
import fitz  # PyMuPDF
from PIL import Image
import logging
import sys
import hashlib

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('img_script.log', encoding='utf-8')
    ]
)

# Папка с библиотекой
LIBRARY_ROOT = r'C:\Users\nowfo\Music\Валторна (2)\Валторна (1)'
THUMBNAIL_DIR = 'thumbnails'
CSV_FILE = 'thumbnails.csv'

os.makedirs(THUMBNAIL_DIR, exist_ok=True)
logging.info(f"Папка для миниатюр: {THUMBNAIL_DIR}")

def get_unique_thumb_name(rel_pdf_path):
    hash_str = hashlib.md5(rel_pdf_path.encode('utf-8')).hexdigest()
    return f"{hash_str}.jpg"

def save_thumbnail(pdf_path, thumb_path):
    logging.info(f"Создание миниатюры: {thumb_path}")
    with fitz.open(pdf_path) as doc:
        page = doc.load_page(0)
        pix = page.get_pixmap(matrix=fitz.Matrix(6, 6))  # чуть меньше DPI, чтобы не терять читаемость
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        width = 400
        w_percent = width / float(img.size[0])
        height = int((float(img.size[1]) * float(w_percent)))
        img = img.resize((width, height), Image.LANCZOS)
        img = img.convert('L')  # greyscale
        img.save(thumb_path, format="JPEG", quality=60, progressive=True)
    logging.info(f"Миниатюра сохранена: {thumb_path}")

def process_local_pdfs(root_dir):
    rows = []
    counter = 0
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.lower().endswith('.pdf'):
                abs_pdf_path = os.path.join(dirpath, filename)
                rel_pdf_path = os.path.relpath(abs_pdf_path, root_dir)
                rel_pdf_path = '/' + rel_pdf_path.replace('\\', '/')
                thumb_name = get_unique_thumb_name(rel_pdf_path)
                thumb_path = os.path.join(THUMBNAIL_DIR, thumb_name)
                try:
                    save_thumbnail(abs_pdf_path, thumb_path)
                    rows.append([rel_pdf_path, f"thumbnails/{thumb_name}"])
                    counter += 1
                    logging.info(f"Миниатюра создана: {thumb_path}")
                except Exception as e:
                    logging.error(f"Ошибка при обработке {abs_pdf_path}: {e}")
                    with open('error_img.txt', 'a', encoding='utf-8') as errf:
                        errf.write(f"{abs_pdf_path}: {e}\n")
    return rows, counter

if __name__ == "__main__":
    logging.info("Старт скрипта img.py (локальная библиотека)")
    rows, counter = process_local_pdfs(LIBRARY_ROOT)
    try:
        logging.info(f"Текущая рабочая директория: {os.getcwd()}")
        abs_csv_path = os.path.abspath(CSV_FILE)
        logging.info(f"CSV будет создан по пути: {abs_csv_path}")
        with open(CSV_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["pdf_path", "thumbnail_path"])
            writer.writerows(rows)
        logging.info(f"Готово! Создано миниатюр: {counter}. CSV: {CSV_FILE}")
        with open('success_img.txt', 'w', encoding='utf-8') as success_file:
            success_file.write(f"Всего миниатюр создано: {counter}\n")
        logging.info("Файл success_img.txt создан.")
    except Exception as e:
        logging.error(f"Ошибка при записи CSV: {e}")
    logging.info("Работа скрипта img.py завершена.") 