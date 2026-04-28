/**
 * Seed tài khoản đăng nhập cho các member hiện có.
 *
 * Cách dùng:
 *   npx ts-node src/migrations/seed-member-accounts.ts
 *
 * Với mỗi member chưa có userId:
 *   - Tạo User với username = email prefix hoặc tên đã normalize
 *   - Mật khẩu mặc định: "1"
 *   - Tạo OrganizationUser với role MEMBER
 *   - Gắn userId vào member
 *
 * An toàn khi chạy lại (idempotent).
 */
import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import slugify from 'slugify';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3308),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'manage_money',
  entities: [__dirname + '/../entities/*.entity.{ts,js}'],
  synchronize: true,
  charset: 'utf8mb4',
  timezone: '+07:00',
});

function toUsername(member: { name: string; email?: string | null }): string {
  if (member.email) {
    return member.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '_');
  }
  return slugify(member.name, { lower: true, strict: true, locale: 'vi' }).replace(/-/g, '_') || 'member';
}

async function main() {
  await AppDataSource.initialize();
  console.log('✅ Kết nối DB thành công');

  const memberRepo = AppDataSource.getRepository('members');
  const userRepo = AppDataSource.getRepository('users');
  const orgUserRepo = AppDataSource.getRepository('organization_users');

  const members = await memberRepo.find({ relations: ['organization'] }) as any[];
  console.log(`📋 Tìm thấy ${members.length} member`);

  const passwordHash = await bcrypt.hash('1', 12);
  let created = 0;
  let skipped = 0;

  for (const member of members) {
    if (member.userId) {
      skipped++;
      continue;
    }

    const baseUsername = toUsername(member);
    let username = baseUsername;
    let suffix = 2;

    // Tìm username chưa bị dùng
    while (await userRepo.findOne({ where: { user_name: username } })) {
      username = `${baseUsername}_${suffix++}`;
    }

    // Tạo User
    const user = userRepo.create({
      user_name: username,
      password: passwordHash,
      display_name: member.name,
    });
    await userRepo.save(user);

    // Tạo OrganizationUser với role MEMBER (nếu chưa có)
    const existingOrgUser = await orgUserRepo.findOne({
      where: { userId: user.id, organizationId: member.organizationId },
    });
    if (!existingOrgUser) {
      await orgUserRepo.save(
        orgUserRepo.create({
          userId: user.id,
          organizationId: member.organizationId,
          role: 'member',
        }),
      );
    }

    // Gắn userId vào member
    await memberRepo.update(member.id, { userId: user.id });

    console.log(`  ✔ ${member.name} → username: "${username}"`);
    created++;
  }

  console.log(`\n🎉 Hoàn thành: tạo ${created} tài khoản, bỏ qua ${skipped} member đã có tài khoản`);
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
