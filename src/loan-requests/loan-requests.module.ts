import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanRequestsController } from './loan-requests.controller';
import { LoanRequestsService } from './loan-requests.service';
import { LoanRequest } from '../entities/loan-request.entity';
import { LoanVote } from '../entities/loan-vote.entity';
import { TransferRequest } from '../entities/transfer-request.entity';
import { Member } from '../entities/member.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanRequest, LoanVote, TransferRequest, Member, ActivityLog]),
    CommonModule,
  ],
  controllers: [LoanRequestsController],
  providers: [LoanRequestsService],
})
export class LoanRequestsModule {}
