FROM node:18-alpine

WORKDIR /app

# Копіюємо package.json та встановлюємо залежності
COPY package*.json ./
RUN npm install

# Копіюємо решту файлів
COPY . .

# Відкриваємо порт (хоча для консольного додатку не потрібно)
EXPOSE 3000

CMD ["npm", "start"]
