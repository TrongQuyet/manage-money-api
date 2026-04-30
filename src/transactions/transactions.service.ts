import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { TransactionType } from '../entities/category.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
  ) {}

  async findAll(
    orgId: number,
    page?: number,
    limit?: number,
    search?: string,
  ): Promise<{ data: Transaction[]; total: number }> {
    const qb = this.txRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.member', 'member')
      .leftJoinAndSelect('tx.category', 'category')
      .where('tx.organization_id = :orgId', { orgId })
      .orderBy('tx.date', 'DESC')
      .addOrderBy('tx.created_at', 'DESC');

    if (search?.trim()) {
      qb.andWhere(
        '(tx.description LIKE :s OR member.name LIKE :s OR tx.recipient LIKE :s)',
        { s: `%${search.trim()}%` },
      );
    }

    const total = await qb.getCount();
    if (limit && limit > 0) {
      qb.skip(((page ?? 1) - 1) * limit).take(limit);
    }
    const data = await qb.getMany();
    return { data, total };
  }

  async findOne(orgId: number, id: number): Promise<Transaction> {
    const tx = await this.txRepo.findOne({
      where: { id, organizationId: orgId },
      relations: ['member', 'category'],
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async create(orgId: number, dto: CreateTransactionDto): Promise<Transaction> {
    const tx = this.txRepo.create({ ...dto, organizationId: orgId });
    return this.txRepo.save(tx);
  }

  async update(orgId: number, id: number, dto: UpdateTransactionDto): Promise<Transaction> {
    const tx = await this.findOne(orgId, id);
    Object.assign(tx, dto);
    return this.txRepo.save(tx);
  }

  async remove(orgId: number, id: number): Promise<void> {
    const result = await this.txRepo.delete({ id, organizationId: orgId });
    if (result.affected === 0) throw new NotFoundException('Transaction not found');
  }

  async getSummary(orgId: number) {
    const result = await this.txRepo
      .createQueryBuilder('tx')
      .select('tx.type', 'type')
      .addSelect('SUM(tx.amount)', 'total')
      .where('tx.organization_id = :orgId', { orgId })
      .groupBy('tx.type')
      .getRawMany();

    let totalIncome = 0;
    let totalExpense = 0;
    for (const row of result) {
      if (row.type === TransactionType.INCOME) totalIncome = Number(row.total);
      else totalExpense = Number(row.total);
    }

    const count = await this.txRepo.count({ where: { organizationId: orgId } });

    return {
      totalIncome,
      totalExpense,
      currentBalance: totalIncome - totalExpense,
      transactionCount: count,
    };
  }
}
