# Многоэтапная сборка для фронтенда
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install

# Копируем исходный код и собираем
COPY . .
RUN npm run build

# Продакшен образ с nginx
FROM nginx:alpine

# Копируем собранные файлы
COPY --from=builder /app/dist /usr/share/nginx/html

# Конфигурация nginx для SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]