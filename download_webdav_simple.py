#!/usr/bin/env python3
"""
Simple WebDAV downloader with retry mechanisms and ZIP archive creation.
Uses requests library for maximum compatibility.
"""
import os
import time
import zipfile
import shutil
import requests
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import urljoin, quote
import xml.etree.ElementTree as ET

# Загружаем переменные окружения из файла .env
load_dotenv()

# Получаем данные для подключения из переменных окружения
WEBDAV_HOSTNAME = os.getenv("WEBDAV_HOSTNAME")
WEBDAV_LOGIN = os.getenv("WEBDAV_LOGIN")
WEBDAV_PASSWORD = os.getenv("WEBDAV_PASSWORD")
WEBDAV_REMOTE_PATH = os.getenv("WEBDAV_REMOTE_PATH", "/")
LOCAL_DOWNLOAD_PATH = os.getenv("LOCAL_DOWNLOAD_PATH", "downloads")

# Настройки
MAX_ZIP_SIZE = int(1.85 * 1024 * 1024 * 1024)  # 1.85 ГБ
MAX_RETRIES = 3
RETRY_DELAY = 5

class SimpleWebDAVClient:
    def __init__(self, base_url, username, password):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.auth = (username, password)
        self.session.headers.update({
            'User-Agent': 'SimpleWebDAV/1.0'
        })

    def propfind(self, path):
        """Get directory listing using PROPFIND"""
        url = urljoin(self.base_url, quote(path.encode('utf-8')))
        headers = {
            'Depth': '1',
            'Content-Type': 'application/xml'
        }
        
        # PROPFIND XML body
        propfind_body = '''<?xml version="1.0" encoding="utf-8"?>
        <D:propfind xmlns:D="DAV:">
            <D:prop>
                <D:resourcetype/>
                <D:getcontentlength/>
                <D:displayname/>
            </D:prop>
        </D:propfind>'''
        
        response = self.session.request('PROPFIND', url, data=propfind_body, headers=headers)
        response.raise_for_status()
        return response.text

    def list_directory(self, path):
        """Parse PROPFIND response and return list of files/directories"""
        try:
            xml_response = self.propfind(path)
            root = ET.fromstring(xml_response)
            
            items = []
            for response in root.findall('.//{DAV:}response'):
                href = response.find('.//{DAV:}href')
                if href is not None:
                    item_path = href.text
                    # Skip the parent directory
                    if item_path.rstrip('/') != path.rstrip('/'):
                        # Check if it's a directory
                        resourcetype = response.find('.//{DAV:}resourcetype')
                        is_dir = resourcetype is not None and resourcetype.find('.//{DAV:}collection') is not None
                        
                        # Get display name
                        displayname = response.find('.//{DAV:}displayname')
                        name = displayname.text if displayname is not None else os.path.basename(item_path.rstrip('/'))
                        
                        items.append({
                            'path': item_path,
                            'name': name,
                            'is_dir': is_dir
                        })
            
            return items
        except Exception as e:
            print(f"Ошибка парсинга XML: {e}")
            return []

    def download_file(self, remote_path, local_path):
        """Download a file from WebDAV"""
        url = urljoin(self.base_url, quote(remote_path.encode('utf-8')))
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        
        with self.session.get(url, stream=True) as response:
            response.raise_for_status()
            with open(local_path, 'wb') as f:
                shutil.copyfileobj(response.raw, f)

def retry_on_error(func, *args, **kwargs):
    """Execute function with retry mechanism"""
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

def create_zip_archives(source_directory):
    """Create ZIP archives with size limit"""
    source_path = Path(source_directory)
    if not source_path.exists() or not source_path.is_dir():
        print(f"Ошибка: Директория '{source_directory}' не найдена")
        return
    
    print(f"Начало создания ZIP архивов из '{source_directory}'...")
    
    # Get all files
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
    
    # Sort files by size (smallest first)
    all_files.sort(key=lambda x: x[2])
    
    archive_num = 1
    current_archive_size = 0
    current_zip = None
    archives_created = []
    
    for file_path, relative_path, file_size in all_files:
        # Check if file fits in current archive
        if current_zip is None or (current_archive_size + file_size) > MAX_ZIP_SIZE:
            # Close previous archive
            if current_zip:
                current_zip.close()
                print(f"Архив {archive_name} создан (размер: {current_archive_size / (1024*1024):.2f} МБ)")
            
            # Create new archive
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
        
        # Add file to archive
        try:
            current_zip.write(file_path, relative_path)
            current_archive_size += file_size
            print(f"Добавлен файл: {relative_path} ({file_size / (1024*1024):.2f} МБ)")
        except Exception as e:
            print(f"Ошибка при добавлении файла {file_path}: {e}")
            continue
    
    # Close last archive
    if current_zip:
        current_zip.close()
        print(f"Архив {archive_name} создан (размер: {current_archive_size / (1024*1024):.2f} МБ)")
    
    print(f"\nВсего создано архивов: {len(archives_created)}")
    for i, archive in enumerate(archives_created, 1):
        try:
            archive_size = os.path.getsize(archive) / (1024*1024*1024)
            print(f"{i}. {archive} ({archive_size:.2f} ГБ)")
        except:
            print(f"{i}. {archive} (размер неизвестен)")

def download_directory(client, remote_path, local_path):
    """Recursively download directory contents"""
    print(f"Проверка удаленной папки: {remote_path}")
    
    # Get directory listing
    items = retry_on_error(client.list_directory, remote_path)
    if items is None:
        print(f"Не удалось получить список файлов в '{remote_path}', пропускаем...")
        return
    
    # Create local directory
    if not os.path.exists(local_path):
        print(f"Создание локальной папки: {local_path}")
        try:
            os.makedirs(local_path)
        except Exception as e:
            print(f"Не удалось создать локальную папку '{local_path}': {e}")
            return
    
    # Process each item
    for item in items:
        item_name = item['name']
        item_path = item['path']
        is_directory = item['is_dir']
        
        # Skip if item name is empty or same as parent
        if not item_name or item_name in ('.', '..'):
            continue
        
        local_item_path = os.path.join(local_path, item_name)
        
        if is_directory:
            print(f"Обнаружена вложенная папка: {item_path}")
            download_directory(client, item_path, local_item_path)
        else:
            print(f"Попытка скачивания файла: {item_path} -> {local_item_path}")
            result = retry_on_error(client.download_file, item_path, local_item_path)
            if result is not None:
                print(f"✅ Успешно скачан: {item_name}")
            else:
                print(f"❌ Не удалось скачать файл '{item_path}', продолжаем...")

if __name__ == "__main__":
    if not all([WEBDAV_HOSTNAME, WEBDAV_LOGIN, WEBDAV_PASSWORD]):
        print("Ошибка: Не все обязательные переменные окружения заданы в файле .env")
        print("Требуются: WEBDAV_HOSTNAME, WEBDAV_LOGIN, WEBDAV_PASSWORD")
    else:
        print("Начало процесса скачивания...")
        print(f"WebDAV сервер: {WEBDAV_HOSTNAME}")
        print(f"Удаленная папка: {WEBDAV_REMOTE_PATH}")
        print(f"Локальная папка: {LOCAL_DOWNLOAD_PATH}")
        print(f"Максимальный размер ZIP-архива: {MAX_ZIP_SIZE / (1024*1024*1024):.2f} ГБ")
        print(f"Количество попыток при ошибке: {MAX_RETRIES}")
        print(f"Время ожидания между попытками: {RETRY_DELAY} сек\n")
        
        try:
            # Create WebDAV client
            client = SimpleWebDAVClient(WEBDAV_HOSTNAME, WEBDAV_LOGIN, WEBDAV_PASSWORD)
            
            # Download files
            download_directory(client, WEBDAV_REMOTE_PATH, LOCAL_DOWNLOAD_PATH)
            print("Скачивание завершено.")
            
            # Create archives if files exist
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