# Многоэтапная сборка для продакшена
FROM node:20-alpine as builder

# Устанавливаем зависимости для canvas
RUN apk add --no-cache cairo-dev pango-dev jpeg-dev giflib-dev pixman-dev \
    freetype-dev fontconfig-dev libpng-dev librsvg-dev

WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

# Продакшен образ
FROM node:20-alpine

# Устанавливаем необходимые пакеты
RUN apk add --no-cache curl tini netcat-openbsd mysql-client \
    cairo pango jpeg giflib pixman freetype fontconfig libpng librsvg

WORKDIR /app

# Создаем пользователя
RUN addgroup -g 1001 -S nodejs && \
    adduser -S musiclib -u 1001

# Копируем зависимости из builder
COPY --from=builder /app/node_modules ./node_modules

# Копируем исходный код
COPY --chown=musiclib:nodejs . .

# Копируем скрипты
COPY --chown=musiclib:nodejs scripts/entrypoint.sh /usr/local/bin/
COPY --chown=musiclib:nodejs scripts/import-terms.sh /app/scripts/
RUN chmod +x /usr/local/bin/entrypoint.sh /app/scripts/import-terms.sh

# Создаем необходимые директории
RUN mkdir -p logs files uploads && \
    chown -R musiclib:nodejs logs files uploads

USER musiclib

EXPOSE 3000

# Проверка здоровья
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]