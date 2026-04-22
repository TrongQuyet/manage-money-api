FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache npm
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache npm
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3334
CMD ["node", "dist/main"]
