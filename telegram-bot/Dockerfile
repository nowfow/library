# Используем официальный Python образ
FROM python:3.11-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Копируем файл с зависимостями
COPY requirements.txt .

# Устанавливаем Python зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Создаем пользователя для безопасности
RUN useradd --create-home --shell /bin/bash botuser

# Копируем исходный код
COPY --chown=botuser:botuser . .

# Создаем директории для данных
RUN mkdir -p logs data && \
    chown -R botuser:botuser logs data

# Переключаемся на непривилегированного пользователя
USER botuser

# Проверка здоровья контейнера
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import asyncio; import aiohttp; asyncio.run(aiohttp.ClientSession().get('http://localhost:3000/health').close())" || exit 1

# Запуск бота
CMD ["python", "bot.py"]