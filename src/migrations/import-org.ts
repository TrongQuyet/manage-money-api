/**
 * Import script: tạo tổ chức, admin, thành viên, và giao dịch từ file JSON.
 *
 * Cách dùng:
 *   npx ts-node src/migrations/import-org.ts src/migrations/data/trum-a9.json
 *
 * Cấu trúc file JSON:
 * {
 *   "organization": { "name": "...", "slug": "...", "description": "..." },
 *   "admin": { "user_name": "...", "password": "..." },
 *   "members": [{ "id": "oldId", "name": "...", "role": "...", ... }],
 *   "transactions": [{ "id": "...", "type": "INCOME|EXPENSE", "amount": ..., "memberId": "oldId", ... }]
 * }
 *
 * Script an toàn để chạy lại nhiều lần (idempotent):
 *   - Bỏ qua nếu tổ chức/admin/thành viên đã tồn tại
 *   - Chỉ thêm giao dịch chưa có
 */
import 'reflect-metadata';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import slugify from 'slugify';
import * as dotenv from 'dotenv';

dotenv.config();

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrgData {
  organization: { name: string; slug?: string; description?: string };
  admin: { user_name: string; password: string };
  members: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    role: string;
    note?: string;
    joinedAt?: string;
  }[];
  transactions: {
    id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description: string;
    category?: string;
    recipient?: string;
    date: string;
    memberId?: string;
  }[];
}

// ── DB connection ─────────────────────────────────────────────────────────────

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3308,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'manage_money',
  charset: 'utf8mb4',
  timezone: '+07:00',
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function generateUniqueSlug(name: string, preferred?: string): Promise<string> {
  const base =
    preferred ||
    slugify(name, { lower: true, strict: true, locale: 'vi' }) ||
    `org-${Date.now()}`;

  let candidate = base;
  let counter = 2;
  while (true) {
    const rows: { id: number }[] = await dataSource.query(
      'SELECT id FROM organizations WHERE slug = ?',
      [candidate],
    );
    if (rows.length === 0) return candidate;
    candidate = `${base}-${counter++}`;
  }
}

// ── Default categories (mirrors CategoriesService) ───────────────────────────

const DEFAULT_CATEGORIES = [
  { name: 'Đóng quỹ định kỳ', type: 'INCOME' },
  { name: 'Đóng góp tự nguyện', type: 'INCOME' },
  { name: 'Tiền lãi', type: 'INCOME' },
  { name: 'Khác', type: 'INCOME' },
  { name: 'Ăn uống', type: 'EXPENSE' },
  { name: 'Dịch vụ', type: 'EXPENSE' },
  { name: 'Sự kiện', type: 'EXPENSE' },
  { name: 'Cơ sở vật chất', type: 'EXPENSE' },
  { name: 'Từ thiện', type: 'EXPENSE' },
  { name: 'Khác', type: 'EXPENSE' },
];

async function seedCategories(orgId: number): Promise<Map<string, number>> {
  // key: "name|type" → categoryId
  const categoryMap = new Map<string, number>();

  const existing: { id: number; name: string; type: string }[] =
    await dataSource.query(
      'SELECT id, name, type FROM categories WHERE organization_id = ? AND is_default = 1',
      [orgId],
    );

  if (existing.length > 0) {
    existing.forEach((c) => categoryMap.set(`${c.name}|${c.type}`, c.id));
    console.log(`  [categories] Đã có ${existing.length} danh mục, bỏ qua seed.`);
    return categoryMap;
  }

  for (const cat of DEFAULT_CATEGORIES) {
    const result = await dataSource.query(
      `INSERT INTO categories (name, type, is_default, is_active, organization_id, created_at)
       VALUES (?, ?, 1, 1, ?, NOW())`,
      [cat.name, cat.type, orgId],
    );
    categoryMap.set(`${cat.name}|${cat.type}`, result.insertId);
  }
  console.log(`  [categories] Đã seed ${DEFAULT_CATEGORIES.length} danh mục mặc định.`);
  return categoryMap;
}

// ── Main import logic ─────────────────────────────────────────────────────────

async function run() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Thiếu đường dẫn file JSON.\nCách dùng: npx ts-node src/migrations/import-org.ts <file.json>');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Không tìm thấy file: ${absolutePath}`);
    process.exit(1);
  }

  const data: OrgData = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));

  await dataSource.initialize();
  console.log('\n=== Bắt đầu import ===\n');

  // ── 1. Tổ chức ──────────────────────────────────────────────────────────────
  let orgId: number;
  const existingOrg: { id: number }[] = await dataSource.query(
    'SELECT id FROM organizations WHERE name = ?',
    [data.organization.name],
  );

  if (existingOrg.length > 0) {
    orgId = existingOrg[0].id;
    console.log(`[org] Tổ chức "${data.organization.name}" đã tồn tại (id: ${orgId}), bỏ qua.`);
  } else {
    const slug = await generateUniqueSlug(data.organization.name, data.organization.slug);
    const result = await dataSource.query(
      `INSERT INTO organizations (name, slug, description, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [data.organization.name, slug, data.organization.description || null],
    );
    orgId = result.insertId;
    console.log(`[org] Đã tạo tổ chức "${data.organization.name}" (slug: ${slug}, id: ${orgId})`);
  }

  // ── 2. Admin user ────────────────────────────────────────────────────────────
  let userId: number;
  let resolvedUsername = data.admin.user_name;

  const existingUser: { id: number; user_name: string }[] = await dataSource.query(
    'SELECT id, user_name FROM users WHERE user_name = ?',
    [data.admin.user_name],
  );

  if (existingUser.length > 0) {
    const existingId = existingUser[0].id;
    const otherOrgLinks: { id: number }[] = await dataSource.query(
      'SELECT id FROM organization_users WHERE user_id = ? AND organization_id != ?',
      [existingId, orgId],
    );

    if (otherOrgLinks.length > 0) {
      const orgSlug = (await dataSource.query('SELECT slug FROM organizations WHERE id = ?', [orgId]))[0]?.slug || `org${orgId}`;
      resolvedUsername = `${data.admin.user_name}-${orgSlug}`;
      const hashedPassword = await bcrypt.hash(data.admin.password, 12);
      const result = await dataSource.query(
        `INSERT INTO users (user_name, password, created_at) VALUES (?, ?, NOW())`,
        [resolvedUsername, hashedPassword],
      );
      userId = result.insertId;
      console.log(`[admin] Username "${data.admin.user_name}" đã dùng cho org khác → tạo mới "${resolvedUsername}" (id: ${userId})`);
    } else {
      userId = existingId;
      console.log(`[admin] User "${data.admin.user_name}" đã tồn tại (id: ${userId}), bỏ qua tạo mới.`);
    }
  } else {
    const hashedPassword = await bcrypt.hash(data.admin.password, 12);
    const result = await dataSource.query(
      `INSERT INTO users (user_name, password, created_at) VALUES (?, ?, NOW())`,
      [resolvedUsername, hashedPassword],
    );
    userId = result.insertId;
    console.log(`[admin] Đã tạo user "${resolvedUsername}" (id: ${userId})`);
  }

  // ── 3. Liên kết admin → tổ chức (organization_users) ────────────────────────
  const existingLink: { id: number }[] = await dataSource.query(
    'SELECT id FROM organization_users WHERE user_id = ? AND organization_id = ?',
    [userId, orgId],
  );

  if (existingLink.length > 0) {
    console.log(`[org-user] Admin đã được liên kết với tổ chức, bỏ qua.`);
  } else {
    await dataSource.query(
      `INSERT INTO organization_users (role, user_id, organization_id, joined_at)
       VALUES ('owner', ?, ?, NOW())`,
      [userId, orgId],
    );
    console.log(`[org-user] Đã liên kết admin với tổ chức (role: owner)`);
  }

  // ── 4. Danh mục mặc định ─────────────────────────────────────────────────────
  const categoryMap = await seedCategories(orgId);

  // ── 5. Thành viên ────────────────────────────────────────────────────────────
  // oldId (từ JSON) → newId (trong DB)
  const memberIdMap = new Map<string, number>();

  const existingMembers: { id: number; name: string }[] = await dataSource.query(
    'SELECT id, name FROM members WHERE organization_id = ?',
    [orgId],
  );
  const existingMemberNames = new Set(existingMembers.map((m) => m.name));

  let membersCreated = 0;
  let membersSkipped = 0;

  for (const member of data.members) {
    if (existingMemberNames.has(member.name)) {
      const found = existingMembers.find((m) => m.name === member.name);
      if (found) memberIdMap.set(member.id, found.id);
      membersSkipped++;
      continue;
    }

    const result = await dataSource.query(
      `INSERT INTO members (name, email, phone, address, role, note, organization_id, joined_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        member.name,
        member.email || null,
        member.phone || null,
        member.address || null,
        member.role,
        member.note || null,
        orgId,
        member.joinedAt ? new Date(member.joinedAt) : new Date(),
      ],
    );
    memberIdMap.set(member.id, result.insertId);
    membersCreated++;
  }

  console.log(`[members] Đã tạo: ${membersCreated}, bỏ qua (đã có): ${membersSkipped}`);

  // ── 6. Giao dịch ─────────────────────────────────────────────────────────────
  let txCreated = 0;
  let txSkipped = 0;

  for (const tx of data.transactions) {
    const resolvedMemberId = tx.memberId ? memberIdMap.get(tx.memberId) ?? null : null;

    const categoryKey = `${tx.category || 'Khác'}|${tx.type}`;
    const categoryId = categoryMap.get(categoryKey) ?? null;

    const existing: { id: number }[] = await dataSource.query(
      `SELECT id FROM transactions
       WHERE organization_id = ? AND date = ? AND description = ? AND amount = ? AND COALESCE(member_id, 0) = ?`,
      [
        orgId,
        tx.date,
        tx.description,
        tx.amount,
        resolvedMemberId ?? 0,
      ],
    );

    if (existing.length > 0) {
      txSkipped++;
      continue;
    }

    await dataSource.query(
      `INSERT INTO transactions (type, amount, description, recipient, date, organization_id, member_id, category_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        tx.type,
        tx.amount,
        tx.description,
        tx.recipient || null,
        tx.date,
        orgId,
        resolvedMemberId,
        categoryId,
      ],
    );
    txCreated++;
  }

  console.log(`[transactions] Đã tạo: ${txCreated}, bỏ qua (đã có): ${txSkipped}`);

  console.log('\n=== Import hoàn tất ===\n');
  await dataSource.destroy();
}

run().catch((err) => {
  console.error('\n[LỖI]', err.message || err);
  process.exit(1);
});
