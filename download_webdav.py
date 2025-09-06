#!/usr/bin/env python3
import os
import time
import zipfile
import shutil
from pathlib import Path
from dotenv import load_dotenv
from webdav3.client import Client

# Загружаем переменные окружения из файла .env
load_dotenv()

# Получаем данные для подключения из переменных окружения
WEBDAV_HOSTNAME = os.getenv("WEBDAV_HOSTNAME")
WEBDAV_LOGIN = os.getenv("WEBDAV_LOGIN")
WEBDAV_PASSWORD = os.getenv("WEBDAV_PASSWORD")
# Удаленная папка на сервере для скачивания (например, '/')
WEBDAV_REMOTE_PATH = os.getenv("WEBDAV_REMOTE_PATH", "/")
# Локальная папка для сохранения файлов
LOCAL_DOWNLOAD_PATH = os.getenv("LOCAL_DOWNLOAD_PATH", "downloads")
# Максимальный размер ZIP архива в байтах (1.85 ГБ)
MAX_ZIP_SIZE = int(1.85 * 1024 * 1024 * 1024)
# Количество попыток при ошибке соединения
MAX_RETRIES = 3
# Время ожидания между попытками (секунды)
RETRY_DELAY = 5


# Настройки для подключения к WebDAV
options = {
    'webdav_hostname': WEBDAV_HOSTNAME,
    'webdav_login': WEBDAV_LOGIN,
    'webdav_password': WEBDAV_PASSWORD
}

# Создаем клиент WebDAV
client = Client(options)

def retry_on_error(func, *args, **kwargs):
    """
    Выполняет функцию с повторными попытками при ошибке.
    """
    for attempt in range(MAX_RETRIES):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            print(f"Ошибка при выполнении {func.__name__} (попытка {attempt + 1}/{MAX_RETRIES}): {e}")
            if attempt < MAX_RETRIES - 1:
                print(f"Ожидание {RETRY_DELAY} секунд перед следующей попыткой...")
                time.sleep(RETRY_DELAY)
            else:
                print(f"Не удалось выполнить {func.__name__} после {MAX_RETRIES} попыток")
                return None

def get_directory_size(directory_path):
    """
    Возвращает размер директории в байтах.
    """
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(directory_path):
        for filename in filenames:
            file_path = os.path.join(dirpath, filename)
            try:
                total_size += os.path.getsize(file_path)
            except (OSError, IOError):
                continue
    return total_size

def create_zip_archives(source_directory):
    """
    Создает ZIP архивы с ограничением по размеру.
    """
    source_path = Path(source_directory)
    if not source_path.exists() or not source_path.is_dir():
        print(f"Ошибка: Директория '{source_directory}' не найдена")
        return
    
    print(f"Начало создания ZIP архивов из '{source_directory}'...")
    
    # Получаем список всех файлов
    all_files = []
    for root, dirs, files in os.walk(source_directory):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                file_size = os.path.getsize(file_path)
                relative_path = os.path.relpath(file_path, source_directory)
                all_files.append((file_path, relative_path, file_size))
            except (OSError, IOError) as e:
                print(f"Не удалось получить размер файла {file_path}: {e}")
                continue
    
    if not all_files:
        print("Нет файлов для архивации")
        return
    
    # Сортируем файлы по размеру (от меньшего к большему)
    all_files.sort(key=lambda x: x[2])
    
    archive_num = 1
    current_archive_size = 0
    current_zip = None
    archives_created = []
    
    for file_path, relative_path, file_size in all_files:
        # Проверяем, поместится ли файл в текущий архив
        if current_zip is None or (current_archive_size + file_size) > MAX_ZIP_SIZE:
            # Закрываем предыдущий архив
            if current_zip:
                current_zip.close()
                print(f"Архив {archive_name} создан (размер: {current_archive_size / (1024*1024):.2f} МБ)")
            
            # Создаем новый архив
            archive_name = f"music_library_part_{archive_num:03d}.zip"
            archives_created.append(archive_name)
            
            try:
                current_zip = zipfile.ZipFile(archive_name, 'w', zipfile.ZIP_DEFLATED, compresslevel=6)
                current_archive_size = 0
                archive_num += 1
                print(f"Создание нового архива: {archive_name}")
            except Exception as e:
                print(f"Ошибка при создании архива {archive_name}: {e}")
                continue
        
        # Добавляем файл в архив
        try:
            current_zip.write(file_path, relative_path)
            current_archive_size += file_size
            print(f"Добавлен файл: {relative_path} ({file_size / (1024*1024):.2f} МБ)")
        except Exception as e:
            print(f"Ошибка при добавлении файла {file_path}: {e}")
            continue
    
    # Закрываем последний архив
    if current_zip:
        current_zip.close()
        print(f"Архив {archive_name} создан (размер: {current_archive_size / (1024*1024):.2f} МБ)")
    
    print(f"\nВсего создано архивов: {len(archives_created)}")
    for i, archive in enumerate(archives_created, 1):
        archive_size = os.path.getsize(archive) / (1024*1024*1024)
        print(f"{i}. {archive} ({archive_size:.2f} ГБ)")
def download_directory(remote_path, local_path):
    """
    Рекурсивно скачивает содержимое удаленной директории с обработкой ошибок.
    """
    print(f"Проверка удаленной папки: {remote_path}")
    
    # Получаем список файлов и папок в удаленной директории с повторными попытками
    remote_items = retry_on_error(client.list, remote_path)
    if remote_items is None:
        print(f"Не удалось получить список файлов в '{remote_path}', пропускаем...")
        return

    # Создаем локальную директорию, если она не существует
    if not os.path.exists(local_path):
        print(f"Создание локальной папки: {local_path}")
        try:
            os.makedirs(local_path)
        except Exception as e:
            print(f"Не удалось создать локальную папку '{local_path}': {e}")
            return

    # Обходим все элементы в удаленной директории
    for item_name in remote_items:
        # Пропускаем корневой элемент, чтобы избежать бесконечной рекурсии
        if item_name == remote_path or item_name == remote_path.rstrip('/'):
            continue
            
        remote_item_path = os.path.join(remote_path, item_name)
        local_item_path = os.path.join(local_path, item_name)

        # Проверяем, является ли элемент директорией
        is_directory = retry_on_error(client.is_dir, remote_item_path)
        if is_directory is None:
            print(f"Не удалось определить тип элемента '{remote_item_path}', пропускаем...")
            continue
            
        if is_directory:
            print(f"Обнаружена вложенная папка: {remote_item_path}")
            # Если это директория, вызываем функцию рекурсивно
            download_directory(remote_item_path, local_item_path)
        else:
            # Если это файл, скачиваем его
            print(f"Попытка скачивания файла: {remote_item_path} -> {local_item_path}")
            result = retry_on_error(client.download_sync, remote_path=remote_item_path, local_path=local_item_path)
            if result is not None:
                print(f"✅ Успешно скачан: {item_name}")
            else:
                print(f"❌ Не удалось скачать файл '{remote_item_path}', продолжаем...")


if __name__ == "__main__":
    if not all([WEBDAV_HOSTNAME, WEBDAV_LOGIN, WEBDAV_PASSWORD]):
        print("Ошибка: Не все обязательные переменные окружения (WEBDAV_HOSTNAME, WEBDAV_LOGIN, WEBDAV_PASSWORD) заданы в файле .env")
    else:
        print("Начало процесса скачивания...")
        print(f"Максимальный размер ZIP-архива: {MAX_ZIP_SIZE / (1024*1024*1024):.2f} ГБ")
        print(f"Количество попыток при ошибке: {MAX_RETRIES}")
        print(f"Время ожидания между попытками: {RETRY_DELAY} сек\n")
        
        try:
            # Скачивание файлов
            download_directory(WEBDAV_REMOTE_PATH, LOCAL_DOWNLOAD_PATH)
            print("Скачивание завершено.")
            
            # Проверяем, есть ли файлы для архивации
            if os.path.exists(LOCAL_DOWNLOAD_PATH) and os.listdir(LOCAL_DOWNLOAD_PATH):
                print(f"\nНачало создания ZIP-архивов...")
                create_zip_archives(LOCAL_DOWNLOAD_PATH)
                print("Архивация завершена!")
            else:
                print("Нет файлов для архивации.")
                
        except KeyboardInterrupt:
            print("\nПроцесс остановлен пользователем.")
        except Exception as e:
            print(f"\nНеожиданная ошибка: {e}")
