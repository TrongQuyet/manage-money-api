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

  async findAll(orgId: string): Promise<Transaction[]> {
    return this.txRepo.find({
      where: { organizationId: orgId },
      relations: ['member', 'category'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(orgId: string, id: string): Promise<Transaction> {
    const tx = await this.txRepo.findOne({
      where: { id, organizationId: orgId },
      relations: ['member', 'category'],
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async create(orgId: string, dto: CreateTransactionDto): Promise<Transaction> {
    const tx = this.txRepo.create({ ...dto, organizationId: orgId });
    return this.txRepo.save(tx);
  }

  async update(orgId: string, id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const tx = await this.findOne(orgId, id);
    Object.assign(tx, dto);
    return this.txRepo.save(tx);
  }

  async remove(orgId: string, id: string): Promise<void> {
    const result = await this.txRepo.delete({ id, organizationId: orgId });
    if (result.affected === 0) throw new NotFoundException('Transaction not found');
  }

  async getSummary(orgId: string) {
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
