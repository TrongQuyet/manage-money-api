import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrgSetting } from '../entities/org-setting.entity';

@Injectable()
export class OrgSettingsService {
  constructor(
    @InjectRepository(OrgSetting)
    private readonly repo: Repository<OrgSetting>,
  ) {}

  async getAll(organizationId: number): Promise<Record<string, string>> {
    const rows = await this.repo.find({ where: { organizationId } });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  async upsert(organizationId: number, key: string, value: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { organizationId, key } });
    if (existing) {
      await this.repo.update(existing.id, { value });
    } else {
      await this.repo.save(this.repo.create({ organizationId, key, value }));
    }
  }
}
