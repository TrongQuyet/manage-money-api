import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, TransactionType } from '../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const DEFAULT_CATEGORIES: { name: string; type: TransactionType }[] = [
  { name: 'Đóng quỹ định kỳ', type: TransactionType.INCOME },
  { name: 'Đóng góp tự nguyện', type: TransactionType.INCOME },
  { name: 'Tiền lãi', type: TransactionType.INCOME },
  { name: 'Khác', type: TransactionType.INCOME },
  { name: 'Ăn uống', type: TransactionType.EXPENSE },
  { name: 'Dịch vụ', type: TransactionType.EXPENSE },
  { name: 'Sự kiện', type: TransactionType.EXPENSE },
  { name: 'Cơ sở vật chất', type: TransactionType.EXPENSE },
  { name: 'Từ thiện', type: TransactionType.EXPENSE },
  { name: 'Khác', type: TransactionType.EXPENSE },
];

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
  ) {}

  async findAll(orgId: string, type?: TransactionType): Promise<Category[]> {
    const where: any = { organizationId: orgId, isActive: true };
    if (type) where.type = type;
    return this.categoryRepo.find({ where, order: { isDefault: 'DESC', name: 'ASC' } });
  }

  async create(orgId: string, dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepo.create({
      ...dto,
      organizationId: orgId,
      isDefault: false,
    });
    return this.categoryRepo.save(category);
  }

  async update(orgId: string, id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!category) throw new NotFoundException('Category not found');
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(orgId: string, id: string): Promise<void> {
    const result = await this.categoryRepo.delete({ id, organizationId: orgId });
    if (result.affected === 0) throw new NotFoundException('Category not found');
  }

  async seedDefaults(orgId: string): Promise<Category[]> {
    const existing = await this.categoryRepo.find({
      where: { organizationId: orgId, isDefault: true },
    });
    if (existing.length > 0) return existing;

    const categories = DEFAULT_CATEGORIES.map((c) =>
      this.categoryRepo.create({ ...c, organizationId: orgId, isDefault: true }),
    );
    return this.categoryRepo.save(categories);
  }
}
