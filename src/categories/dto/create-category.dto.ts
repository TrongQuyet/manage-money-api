import { IsString, IsNotEmpty, IsEnum, MaxLength } from 'class-validator';
import { TransactionType } from '../../entities/category.entity';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEnum(TransactionType)
  type: TransactionType;
}
