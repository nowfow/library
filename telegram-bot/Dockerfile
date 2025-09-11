# Многоэтапная сборка для Python
FROM python:3.11-slim AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Продакшен образ
FROM python:3.11-slim

# Устанавливаем минимальные системные зависимости
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Создаем пользователя
RUN useradd --create-home --shell /bin/bash botuser

# Копируем зависимости из builder
COPY --from=builder /root/.local /home/botuser/.local
ENV PATH=/home/botuser/.local/bin:$PATH

# Копируем исходный код
COPY --chown=botuser:botuser . .

# Создаем необходимые директории и файлы лога с правильными правами
RUN mkdir -p logs data && \
    touch logs/bot.log && \
    chown -R botuser:botuser logs data && \
    chmod 666 logs/bot.log

USER botuser

CMD ["python", "bot.py"]