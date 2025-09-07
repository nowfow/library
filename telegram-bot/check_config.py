#!/usr/bin/env python3
"""
Проверка конфигурации Telegram бота
"""

import sys
import os

# Добавляем путь к модулям
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def check_python_version():
    """Проверка версии Python"""
    if sys.version_info < (3, 11):
        print("❌ Требуется Python 3.11 или выше")
        return False
    print(f"✅ Python {sys.version.split()[0]} - OK")
    return True

def check_dependencies():
    """Проверка зависимостей"""
    required_packages = [
        'aiogram',
        'aiohttp',
        'aiofiles',
        'python-dotenv',
        'loguru',
        'pydantic'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package} - OK")
        except ImportError:
            print(f"❌ {package} - НЕ УСТАНОВЛЕН")
            missing_packages.append(package)
    
    return len(missing_packages) == 0

def check_config():
    """Проверка конфигурации"""
    try:
        from config.settings import settings
        
        # Проверяем обязательные настройки
        if not settings.TELEGRAM_BOT_TOKEN:
            print("❌ TELEGRAM_BOT_TOKEN не настроен")
            return False
        
        if not settings.BACKEND_API_URL:
            print("❌ BACKEND_API_URL не настроен")
            return False
        
        # Проверяем базовые настройки
        print(f"✅ Токен бота: {settings.TELEGRAM_BOT_TOKEN[:10]}...")
        print(f"✅ API URL: {settings.BACKEND_API_URL}")
        print(f"✅ Уровень логов: {settings.LOG_LEVEL}")
        print(f"✅ База данных: {settings.DATABASE_URL}")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка загрузки конфигурации: {e}")
        return False

def check_imports():
    """Проверка импортов модулей"""
    modules_to_check = [
        'config.settings',
        'config.database',
        'services.api_client',
        'handlers.auth_handlers',
        'handlers.search_handlers',
        'middleware.auth',
        'middleware.logging',
        'keyboards.inline',
        'keyboards.reply'
    ]
    
    failed_imports = []
    
    for module in modules_to_check:
        try:
            __import__(module)
            print(f"✅ {module} - OK")
        except Exception as e:
            print(f"❌ {module} - ОШИБКА: {e}")
            failed_imports.append(module)
    
    return len(failed_imports) == 0

def main():
    print("🤖 Проверка конфигурации Telegram бота")
    print("=" * 40)
    
    all_checks_passed = True
    
    # Проверка версии Python
    print("\n🐍 Проверка Python:")
    if not check_python_version():
        all_checks_passed = False
    
    # Проверка зависимостей
    print("\n📦 Проверка зависимостей:")
    if not check_dependencies():
        all_checks_passed = False
        print("\n💡 Для установки зависимостей выполните:")
        print("   pip install -r requirements.txt")
    
    # Проверка конфигурации
    print("\n⚙️ Проверка конфигурации:")
    if not check_config():
        all_checks_passed = False
        print("\n💡 Создайте .env файл и настройте переменные:")
        print("   cp .env.example .env")
    
    # Проверка импортов
    print("\n📂 Проверка модулей:")
    if not check_imports():
        all_checks_passed = False
    
    # Результат
    print("\n" + "=" * 40)
    if all_checks_passed:
        print("🎉 Все проверки пройдены! Бот готов к запуску.")
        print("\n🚀 Для запуска бота выполните:")
        print("   python bot.py")
        return 0
    else:
        print("❌ Обнаружены проблемы. Исправьте их перед запуском.")
        return 1

if __name__ == "__main__":
    sys.exit(main())