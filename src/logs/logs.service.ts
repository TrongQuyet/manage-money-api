import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { AuditLog } from '../entities/audit-log.entity';

export interface ActivityLogParams {
  userId?: number;
  userName?: string;
  action: string;
  entityType?: string;
  entityId?: number;
  orgId?: number;
  metadata?: Record<string, unknown>;
}

export interface AuditLogParams {
  userId?: number;
  userName?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  tableName: string;
  recordId: number;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  orgId?: number;
}

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(ActivityLog) private activityRepo: Repository<ActivityLog>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  logActivity(params: ActivityLogParams): void {
    this.activityRepo.save(this.activityRepo.create(params)).catch(() => null);
  }

  logAudit(params: AuditLogParams): void {
    this.auditRepo.save(this.auditRepo.create(params)).catch(() => null);
  }

  async getActivityLogs(
    orgId: number,
    page = 1,
    limit = 20,
  ): Promise<{ data: ActivityLog[]; total: number }> {
    const [data, total] = await this.activityRepo.findAndCount({
      where: { orgId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async getAuditLogs(
    orgId: number,
    page = 1,
    limit = 20,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const [data, total] = await this.auditRepo.findAndCount({
      where: { orgId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }
}
