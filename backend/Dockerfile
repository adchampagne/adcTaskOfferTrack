# Используем Node 22 LTS - стабильная версия с поддержкой better-sqlite3
FROM node:22-alpine AS builder

# Устанавливаем зависимости для сборки нативных модулей
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая dev для сборки TS)
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем TypeScript
RUN npm run build

# Production stage
FROM node:22-alpine

# Устанавливаем FFmpeg для очистки метаданных + зависимости для нативных модулей
RUN apk add --no-cache python3 make g++ ffmpeg

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm ci --only=production && \
    apk del python3 make g++ && \
    rm -rf /root/.npm /root/.cache

# Создаём директорию для временных файлов очистки метаданных
RUN mkdir -p /app/temp

# Копируем собранный код из builder
COPY --from=builder /app/dist ./dist

# Создаём директории для данных и загрузок
RUN mkdir -p /app/data /app/uploads

# Порт приложения
EXPOSE 3000

# Запускаем приложение
CMD ["node", "dist/index.js"]
