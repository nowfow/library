# Используем официальный Node.js образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем необходимые системные пакеты
RUN apk add --no-cache \
    tini \
    curl

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production && \
    npm cache clean --force

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S musiclib -u 1001

# Копируем исходный код
COPY --chown=musiclib:nodejs src/ ./src/
COPY --chown=musiclib:nodejs populate-db.js ./

# Создаем директории для логов и файлов
RUN mkdir -p logs files && \
    chown -R musiclib:nodejs logs files

# Переключаемся на непривилегированного пользователя
USER musiclib

# Открываем порт
EXPOSE 3000

# Проверка здоровья контейнера
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Используем tini как init процесс для правильной обработки сигналов
ENTRYPOINT ["/sbin/tini", "--"]

# Запускаем приложение
CMD ["node", "src/index.js"]