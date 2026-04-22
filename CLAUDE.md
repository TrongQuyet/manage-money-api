# manage-money-api

NestJS REST API cho ứng dụng quản lý quỹ nhóm. Hỗ trợ nhiều tổ chức (multi-tenant) với phân quyền theo tổ chức.

## Lệnh thường dùng

```bash
npm run start:dev          # Chạy dev server với hot-reload (port 3334)
npm run build              # Build production → dist/
npm start                  # Chạy bản đã build
npm run lint               # Kiểm tra ESLint
```

**Import dữ liệu tổ chức mới:**
```bash
npx ts-node src/migrations/import-org.ts src/migrations/data/<file>.json
```

**Migrations:**
```bash
npx ts-node src/migrations/seed-org-slugs.ts   # Backfill slug cho org cũ
```

## Tech stack

- **Framework**: NestJS 10 + TypeScript
- **Database**: MySQL 8+ via TypeORM 0.3
- **Auth**: Passport.js + JWT (httpOnly cookies)
- **Password**: bcrypt (salt rounds: 12)
- **Validation**: class-validator + class-transformer
- **Utilities**: slugify, cookie-parser

## Cấu trúc thư mục

```
src/
├── auth/                        # Đăng ký, đăng nhập, JWT refresh
│   ├── guards/                  # JwtAuthGuard, JwtRefreshGuard
│   └── strategies/              # JwtStrategy (đọc cookie access_token)
├── entities/                    # TypeORM entities
│   ├── user.entity.ts
│   ├── organization.entity.ts
│   ├── organization-user.entity.ts   # Bảng nối user ↔ org (OWNER/ADMIN/MEMBER)
│   ├── member.entity.ts              # Thành viên của quỹ
│   ├── transaction.entity.ts         # Thu chi
│   ├── category.entity.ts            # Danh mục thu chi
│   └── refresh-token.entity.ts
├── organizations/               # CRUD tổ chức, mời user
├── members/                     # CRUD thành viên
├── transactions/                # CRUD giao dịch
├── categories/                  # CRUD danh mục
├── common/
│   ├── guards/
│   │   ├── org-member.guard.ts  # Xác nhận user thuộc org, set req.orgId
│   │   └── org-admin.guard.ts   # Xác nhận role OWNER hoặc ADMIN
│   └── decorators/
│       ├── current-user.decorator.ts
│       └── org-id.decorator.ts
├── migrations/
│   ├── data/                    # File JSON dữ liệu từng tổ chức
│   │   ├── trum-a9.json
│   │   └── lien-trung.json
│   ├── import-org.ts            # Script import tổ chức từ JSON
│   └── seed-org-slugs.ts
└── app.module.ts                # TypeORM config, import các module
```

## Environment variables

Tạo file `.env` ở root:

```env
NODE_ENV=development
PORT=3334

DB_HOST=localhost
DB_PORT=3308
DB_NAME=manage_money
DB_USER=root
DB_PASSWORD=

JWT_ACCESS_SECRET=<64-byte hex>
JWT_REFRESH_SECRET=<64-byte hex>
REGISTRATION_SECRET=manage_money_register_2026
```

Tạo JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Database

**MySQL cần chạy trước** (port 3308). Tạo database:
```sql
CREATE DATABASE manage_money CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

`synchronize: true` trong dev — TypeORM tự tạo/cập nhật bảng khi chạy.  
`synchronize: false` trong production — cần migration thủ công.

**Lưu ý tên cột**: TypeORM không áp dụng naming strategy nên cột camelCase giữ nguyên (`createdAt`, `joinedAt`, `isDefault`). Cột FK dùng `@JoinColumn({ name: '...' })` nên là snake_case (`organization_id`, `member_id`).

## API Endpoints

Base URL: `http://localhost:3334/api`

| Method | Route | Guard | Mô tả |
|--------|-------|-------|-------|
| POST | `/auth/register` | — | Đăng ký (cần `REGISTRATION_SECRET`) |
| POST | `/auth/login` | — | Đăng nhập → set cookies |
| POST | `/auth/logout` | — | Đăng xuất |
| POST | `/auth/refresh` | JwtRefresh | Làm mới token |
| GET | `/auth/me` | Jwt | Thông tin user hiện tại |
| POST | `/organizations` | Jwt | Tạo tổ chức |
| GET | `/organizations/mine` | Jwt | Danh sách org của user |
| GET | `/organizations/by-slug/:slug` | — | Tìm org theo slug |
| GET | `/:orgSlug/members` | Jwt + OrgMember | Danh sách thành viên |
| POST | `/:orgSlug/members` | Jwt + OrgAdmin | Thêm thành viên |
| PUT | `/:orgSlug/members/:id` | Jwt + OrgAdmin | Sửa thành viên |
| DELETE | `/:orgSlug/members/:id` | Jwt + OrgAdmin | Xóa thành viên |
| GET | `/:orgSlug/transactions` | Jwt + OrgMember | Danh sách giao dịch |
| GET | `/:orgSlug/transactions/summary` | Jwt + OrgMember | Tổng thu/chi/tồn |
| POST | `/:orgSlug/transactions` | Jwt + OrgAdmin | Thêm giao dịch |
| PUT | `/:orgSlug/transactions/:id` | Jwt + OrgAdmin | Sửa giao dịch |
| DELETE | `/:orgSlug/transactions/:id` | Jwt + OrgAdmin | Xóa giao dịch |
| GET | `/:orgSlug/categories` | Jwt + OrgMember | Danh mục |
| POST | `/:orgSlug/categories/seed` | Jwt + OrgMember | Tạo danh mục mặc định |
| POST | `/:orgSlug/categories` | Jwt + OrgAdmin | Tạo danh mục tùy chỉnh |

## Luồng xác thực

1. Login → JWT access token (15 phút) + refresh token (7 ngày) lưu trong httpOnly cookie
2. Mỗi request bảo vệ → `JwtStrategy` đọc `request.cookies.access_token`
3. Khi access token hết hạn → frontend gọi `/auth/refresh` tự động
4. Refresh token được lưu hash trong bảng `refresh_tokens`, bị revoke sau mỗi lần dùng

## Multi-tenant

Mỗi tổ chức cô lập hoàn toàn qua `organization_id`:
- URL dùng `orgSlug` để định danh tổ chức
- `OrgMemberGuard` tra cứu org theo slug, set `req.orgId` và `req.orgRole`
- `OrgAdminGuard` chặn nếu role là MEMBER (chỉ cho phép OWNER/ADMIN)

**Mỗi admin chỉ quản lý một tổ chức** — được kiểm soát qua bảng `organization_users`.

## Import dữ liệu tổ chức mới

Tạo file JSON theo cấu trúc trong `src/migrations/data/trum-a9.json`, rồi chạy:

```bash
npx ts-node src/migrations/import-org.ts src/migrations/data/<file>.json
```

Script tự động:
- Bỏ qua nếu tổ chức/thành viên đã tồn tại (idempotent)
- Tạo username admin độc lập nếu trùng với username đã dùng cho org khác
- Map `memberId` cũ → UUID mới cho giao dịch
- Seed 10 danh mục mặc định

## Docker

```bash
# Dev (hot-reload)
docker compose -f docker-compose.dev.yml up -d --build

# Production
docker compose up -d --build
```
