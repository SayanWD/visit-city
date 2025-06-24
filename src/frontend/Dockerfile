# Stage 1: сборка на образе с glibc
FROM node:20-slim AS build
WORKDIR /app

# Копируем package-файлы и ставим зависимости
COPY package.json package-lock.json* ./
RUN npm ci

# Копируем весь проект фронтенда и собираем
COPY . ./
RUN npm run build

# Stage 2: отдача через nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
