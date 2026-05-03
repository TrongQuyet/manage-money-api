import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateEventDto } from './create-event.dto';
import { EventStatus } from '../../entities/event.entity';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;
}
