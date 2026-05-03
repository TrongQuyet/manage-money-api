import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from '../entities/event.entity';
import { EventVote } from '../entities/event-vote.entity';
import { CommonModule } from '../common/common.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventVote]), CommonModule, LogsModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
