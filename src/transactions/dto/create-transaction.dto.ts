import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { TransactionType } from '../../entities/category.entity';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  recipient?: string;

  @IsDateString()
  date: string;

  @IsNumber()
  @IsOptional()
  memberId?: number;
}
