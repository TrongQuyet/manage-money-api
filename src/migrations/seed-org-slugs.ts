/**
 * Backfill script: generates slug for existing organizations that have no slug.
 * Run once before deploying the slug-based routing changes.
 * Usage: npx ts-node src/migrations/seed-org-slugs.ts
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import slugify from 'slugify';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3308,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'manage_money',
  charset: 'utf8mb4',
});

async function run() {
  await dataSource.initialize();

  // Add slug column if it doesn't exist yet
  const columns: { Field: string }[] = await dataSource.query(
    "SHOW COLUMNS FROM organizations LIKE 'slug'",
  );
  if (columns.length === 0) {
    await dataSource.query('ALTER TABLE organizations ADD COLUMN slug VARCHAR(50) NULL UNIQUE');
    console.log('Đã thêm column slug vào bảng organizations');
  }

  const orgs: { id: string; name: string; slug: string | null }[] =
    await dataSource.query('SELECT id, name, slug FROM organizations');

  const needsSlug = orgs.filter((o) => !o.slug);
  if (needsSlug.length === 0) {
    console.log('Tất cả tổ chức đã có slug. Không cần backfill.');
    await dataSource.destroy();
    return;
  }

  const usedSlugs = new Set(orgs.filter((o) => o.slug).map((o) => o.slug));

  for (const org of needsSlug) {
    let base = slugify(org.name, { lower: true, strict: true, locale: 'vi' });
    if (!base) base = `org-${org.id.substring(0, 8)}`;

    let candidate = base;
    let counter = 2;
    while (usedSlugs.has(candidate)) {
      candidate = `${base}-${counter++}`;
    }
    usedSlugs.add(candidate);

    await dataSource.query('UPDATE organizations SET slug = ? WHERE id = ?', [candidate, org.id]);
    console.log(`  ${org.name} → ${candidate}`);
  }

  console.log(`\nĐã cập nhật ${needsSlug.length} tổ chức.`);
  await dataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
