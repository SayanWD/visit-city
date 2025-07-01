# src/backend/Dockerfile
FROM node:20-alpine

# 1) Копируем только package-файлы, ставим зависимости
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production

# 2) Копируем весь код из контекста (src/backend) прямо в /app
COPY . .

# 3) Запуск
CMD ["node", "index.js"]
