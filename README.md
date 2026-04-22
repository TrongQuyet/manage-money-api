# Manage Money API

Backend NestJS cho ứng dụng quản lý quỹ nhóm. Cung cấp REST API xác thực JWT, quản lý tổ chức, thành viên, danh mục và giao dịch.

---

## Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đang chạy
- MySQL đang chạy trên máy host ở port `3308`
- Docker network `manage_money_net` đã được tạo

---

## Cài đặt lần đầu

### 1. Tạo Docker network (chỉ cần làm một lần)

```bash
docker network create manage_money_net
```

### 2. Tạo file `.env` từ mẫu

```bash
cp .env.example .env
```

Chỉnh sửa `.env` với thông tin thực tế:

```env
NODE_ENV=development
PORT=3334

DB_HOST=localhost
DB_PORT=3308
DB_NAME=manage_money
DB_USER=root
DB_PASSWORD=your_db_password

JWT_ACCESS_SECRET=<64-byte random hex>
JWT_REFRESH_SECRET=<64-byte random hex>

REGISTRATION_SECRET=your_registration_secret
```

Tạo JWT secret ngẫu nhiên:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Tạo database

Đăng nhập MySQL và tạo database:

```sql
CREATE DATABASE manage_money CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## Chạy ứng dụng

### Môi trường Development (hot-reload)

Sửa code không cần build lại — NestJS tự động reload khi có thay đổi trong `src/`.

```bash
# Lần đầu hoặc khi thay đổi package.json
docker compose -f docker-compose.dev.yml up -d --build

# Các lần sau
docker compose -f docker-compose.dev.yml up -d
```

### Môi trường Production

```bash
docker compose up -d --build
```

---

## Kiểm tra logs

```bash
# Dev
docker logs manage-money-api-dev -f

# Production
docker logs manage-money-api -f
```

---

## Dừng container

```bash
# Dev
docker compose -f docker-compose.dev.yml down

# Production
docker compose down
```

---

## API Endpoints

Base URL: `http://localhost:3334/api`

### Auth

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/auth/register` | Đăng ký tài khoản (cần `REGISTRATION_SECRET`) |
| POST | `/auth/login` | Đăng nhập, trả về access + refresh token |
| POST | `/auth/refresh` | Làm mới access token |
| POST | `/auth/logout` | Đăng xuất |

### Organizations

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/organizations` | Danh sách tổ chức |
| POST | `/organizations` | Tạo tổ chức mới |
| GET | `/organizations/:id` | Chi tiết tổ chức |
| PATCH | `/organizations/:id` | Cập nhật tổ chức |
| DELETE | `/organizations/:id` | Xóa tổ chức |

### Members

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/members` | Danh sách thành viên |
| POST | `/members` | Thêm thành viên |
| PATCH | `/members/:id` | Cập nhật thành viên |
| DELETE | `/members/:id` | Xóa thành viên |

### Categories

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/categories` | Danh sách danh mục |
| POST | `/categories` | Tạo danh mục |
| PATCH | `/categories/:id` | Cập nhật danh mục |
| DELETE | `/categories/:id` | Xóa danh mục |

### Transactions

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/transactions` | Danh sách giao dịch |
| POST | `/transactions` | Tạo giao dịch |
| PATCH | `/transactions/:id` | Cập nhật giao dịch |
| DELETE | `/transactions/:id` | Xóa giao dịch |

> Tất cả endpoints (trừ `/auth/login`, `/auth/register`) yêu cầu header `Authorization: Bearer <access_token>`

---

## Cấu trúc thư mục

```
src/
├── auth/           # Xác thực JWT, login, register, refresh token
├── categories/     # Quản lý danh mục thu/chi
├── common/         # Guards, decorators dùng chung
├── entities/       # TypeORM entities
├── members/        # Quản lý thành viên
├── organizations/  # Quản lý tổ chức/quỹ nhóm
├── transactions/   # Quản lý giao dịch
├── app.module.ts
└── main.ts
```
