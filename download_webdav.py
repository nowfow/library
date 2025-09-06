import os
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


# Настройки для подключения к WebDAV
options = {
    'webdav_hostname': WEBDAV_HOSTNAME,
    'webdav_login': WEBDAV_LOGIN,
    'webdav_password': WEBDAV_PASSWORD
}

# Создаем клиент WebDAV
client = Client(options)

def download_directory(remote_path, local_path):
    """
    Рекурсивно скачивает содержимое удаленной директории.
    """
    print(f"Проверка удаленной папки: {remote_path}")
    
    # Получаем список файлов и папок в удаленной директории
    try:
        remote_items = client.list(remote_path)
    except Exception as e:
        print(f"Ошибка при получении списка файлов в '{remote_path}': {e}")
        return

    # Создаем локальную директорию, если она не существует
    if not os.path.exists(local_path):
        print(f"Создание локальной папки: {local_path}")
        os.makedirs(local_path)

    # Обходим все элементы в удаленной директории
    for item_name in remote_items:
        # Пропускаем корневой элемент, чтобы избежать бесконечной рекурсии
        if item_name == remote_path or item_name == remote_path.rstrip('/'):
            continue
            
        remote_item_path = os.path.join(remote_path, item_name)
        local_item_path = os.path.join(local_path, item_name)

        # Проверяем, является ли элемент директорией
        if client.is_dir(remote_item_path):
            print(f"Обнаружена вложенная папка: {remote_item_path}")
            # Если это директория, вызываем функцию рекурсивно
            download_directory(remote_item_path, local_item_path)
        else:
            # Если это файл, скачиваем его
            print(f"Скачивание файла: {remote_item_path} -> {local_item_path}")
            try:
                client.download_sync(remote_path=remote_item_path, local_path=local_item_path)
            except Exception as e:
                print(f"Не удалось скачать файл '{remote_item_path}': {e}")


if __name__ == "__main__":
    if not all([WEBDAV_HOSTNAME, WEBDAV_LOGIN, WEBDAV_PASSWORD]):
        print("Ошибка: Не все обязательные переменные окружения (WEBDAV_HOSTNAME, WEBDAV_LOGIN, WEBDAV_PASSWORD) заданы в файле .env")
    else:
        print("Начало процесса скачивания...")
        download_directory(WEBDAV_REMOTE_PATH, LOCAL_DOWNLOAD_PATH)
        print("Скачивание завершено.")
