# 🤖 Music Library Telegram Bot

Telegram bot для поиска и просмотра музыкальной коллекции с интеграцией в основную систему.

## 📋 Возможности

### 🔍 **Поиск**
- **Поиск по композитору**: Найти все произведения конкретного композитора
- **Поиск по произведению**: Поиск по названию музыкального произведения  
- **Поиск терминов**: Словарь музыкальных терминов с определениями

### 📁 **Файловая навигация**
- **Просмотр директорий**: Навигация по файловой структуре WebDAV
- **Пагинация**: Удобный просмотр больших каталогов
- **Скачивание файлов**: Прямые ссылки на скачивание нот и аудио

### 🎵 **Поддерживаемые форматы**
- **PDF** - ноты в формате PDF
- **MP3, WAV, FLAC** - аудиофайлы
- **SIB, MUS** - файлы нотных редакторов (Sibelius, Finale)
- **ZIP, RAR** - архивы

## 🚀 Быстрый запуск

### 1. Создание бота в Telegram

1. Найдите [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните полученный токен

### 2. Установка зависимостей

```bash
# Перейдите в директорию бота
cd telegram-bot

# Установите зависимости
npm install
```

### 3. Конфигурация

Бот использует общий `.env` файл из корневой директории проекта:

```bash
# Отредактируйте главный .env файл в корне проекта
cd ..
nano .env
```

### 4. Конфигурация в главном .env файле

Все настройки находятся в файле `.env` в корне проекта:

```env
# External Database Configuration (your remote MySQL server)
DB_HOST=your_remote_database_host
DB_PORT=3306
DB_NAME=music_library
DB_USER=your_db_username
DB_PASSWORD=your_db_password

# WebDAV Configuration (required for file storage)
WEBDAV_URL=https://webdav.yandex.ru
WEBDAV_USER=your_webdav_username
WEBDAV_PASSWORD=your_webdav_password

# Telegram Bot Configuration (required for bot functionality)
BOT_TOKEN=your_telegram_bot_token_from_botfather

# Development vs Production
COMPOSE_PROJECT_NAME=music-library
```

### 5. Запуск

#### Запуск только бота:
```bash
cd telegram-bot
npm run dev
```

#### Запуск вместе с основным проектом:
```bash
# Из корня проекта
./start.sh
```

## 📱 Использование бота

### Основные команды

| Команда | Описание |
|---------|----------|
| `/start` | Приветствие и главное меню |
| `/help` | Справка по использованию |
| `/search_composer <имя>` | Поиск по композитору |
| `/search_work <название>` | Поиск по произведению |
| `/search_term <термин>` | Поиск музыкального термина |
| `/browse` | Просмотр файлов |

### Примеры использования

```
/search_composer Бах
/search_composer Mozart

/search_work Соната
/search_work Этюд

/search_term аккорд
/search_term темп
```

### Навигация

- 🎵 **Inline-кнопки** для удобной навигации
- ⬅️➡️ **Пагинация** для просмотра больших списков
- 📁 **Breadcrumb** навигация в файловой системе
- 🔍 **Контекстные меню** для разных типов контента

## 🏗️ Архитектура

### Структура проекта

```
telegram-bot/
├── src/
│   ├── commands/          # Обработчики команд
│   │   ├── start.js       # /start команда
│   │   ├── help.js        # /help команда
│   │   └── search.js      # Команды поиска
│   ├── handlers/          # Обработчики callback queries
│   │   ├── searchHandlers.js    # Поиск и результаты
│   │   └── fileNavigation.js    # Файловая навигация
│   ├── services/          # Сервисы для работы с API
│   │   └── api.js         # Интеграция с backend API
│   ├── utils/             # Вспомогательные утилиты
│   │   ├── keyboards.js   # Inline-клавиатуры
│   │   ├── formatting.js  # Форматирование текста
│   │   └── errorHandler.js # Обработка ошибок
│   └── index.js           # Главный файл бота
├── package.json
└── README.md

**Примечание**: Конфигурация находится в главном `.env` файле в корне проекта.
```

### Интеграция с backend

Бот использует существующие API endpoints:

- `GET /api/works` - поиск произведений
- `GET /api/works/files` - получение файлов произведения  
- `GET /api/terms/search` - поиск терминов
- `GET /api/files/cloud/list` - список файлов WebDAV
- `GET /api/files/pdf` - скачивание файлов

## 🔧 Разработка

### Технологии

- **[Telegraf.js](https://telegraf.js.org/)** v4.16+ - современный фреймворк для Telegram ботов
- **Node.js** v16+ - среда выполнения
- **Axios** - HTTP клиент для API запросов
- **MySQL2** - подключение к базе данных
- **WebDAV** - работа с файловым хранилищем

### Возможности Telegraf

- 🎨 **Rich formatting** с `fmt` template literals
- ⌨️ **Inline keyboards** для интерактивности
- 📄 **Session management** для состояния пользователя
- 🔄 **Middleware pattern** для обработки запросов
- 🛡️ **Error handling** и graceful shutdown

### Добавление новых функций

1. **Новая команда**:
```javascript
// src/commands/newCommand.js
export const newCommand = async (ctx) => {
  await ctx.reply('Новая команда!');
};

// Регистрация в src/index.js
bot.command('new', newCommand);
```

2. **Новый обработчик callback**:
```javascript
// src/handlers/newHandler.js
export function newHandler(bot) {
  bot.action(/^new:/, async (ctx) => {
    // Обработка callback
  });
}
```

3. **Новый API endpoint**:
```javascript
// src/services/api.js
export async function newApiFunction(params) {
  const response = await apiClient.get('/api/new', { params });
  return response.data;
}
```

## 🐛 Отладка

### Логирование

```javascript
// Включить отладочные логи
console.log('Debug info:', data);

// Логирование ошибок
console.error('Error:', error);
```

### Проверка API

```bash
# Проверить работу backend API
curl http://localhost:3000/api/works

# Проверить поиск терминов
curl "http://localhost:3000/api/terms/search?q=аккорд"
```

### Telegram Bot API

```bash
# Проверить webhook (если используется)
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Получить информацию о боте
curl "https://api.telegram.org/bot<TOKEN>/getMe"
```

## 🚀 Деплой

### Production настройки

```env
NODE_ENV=production
BOT_TOKEN=your_production_bot_token
API_BASE_URL=https://your-domain.com
```

### PM2 (рекомендуется)

```bash
# Установить PM2
npm install -g pm2

# Запустить бота
pm2 start src/index.js --name "music-bot"

# Автозапуск
pm2 startup
pm2 save
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
CMD ["node", "src/index.js"]
```

## 📈 Мониторинг

### Логи

```bash
# Просмотр логов в development
npm run dev

# Логи PM2
pm2 logs music-bot

# Логи Docker
docker logs container_name
```

### Метрики

- 📊 Количество пользователей
- 🔍 Популярные поисковые запросы  
- 📁 Активность просмотра файлов
- ⚡ Время ответа API

## 🔐 Безопасность

### Рекомендации

1. **Никогда не коммитьте токены** в git
2. **Используйте .env файлы** для конфиденциальных данных
3. **Ограничьте доступ к API** по IP или токенами
4. **Валидируйте пользовательский ввод**
5. **Регулярно обновляйте зависимости**

### Переменные окружения

```bash
# Обязательные
BOT_TOKEN=...           # Токен Telegram бота
DB_PASSWORD=...         # Пароль базы данных
WEBDAV_PASSWORD=...     # Пароль WebDAV

# Опциональные
API_BASE_URL=...        # URL backend API
PORT=...                # Порт для бота (если нужен)
```

## 🆘 Помощь и поддержка

### Частые проблемы

**Бот не отвечает:**
- Проверьте токен бота
- Убедитесь, что backend API запущен
- Проверьте логи на ошибки

**Ошибка подключения к API:**
- Проверьте `API_BASE_URL` в .env
- Убедитесь, что backend доступен
- Проверьте CORS настройки

**Файлы не загружаются:**
- Проверьте WebDAV настройки
- Убедитесь в правильности путей
- Проверьте права доступа

### Полезные ссылки

- [Telegraf.js Documentation](https://telegraf.js.org/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 📄 Лицензия

MIT License - см. файл LICENSE для деталей.

---

**🎵 Приятного использования музыкальной библиотеки!** 🎼