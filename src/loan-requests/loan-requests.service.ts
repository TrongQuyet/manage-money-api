import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanRequest, LoanRequestStatus } from '../entities/loan-request.entity';
import { LoanVote } from '../entities/loan-vote.entity';
import { TransferRequest } from '../entities/transfer-request.entity';
import { Member } from '../entities/member.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { CreateLoanRequestDto } from './dto/create-loan-request.dto';
import { AdminReviewDto } from './dto/admin-review.dto';
import { VoteLoanRequestDto } from './dto/vote-loan-request.dto';

@Injectable()
export class LoanRequestsService {
  constructor(
    @InjectRepository(LoanRequest) private loanRepo: Repository<LoanRequest>,
    @InjectRepository(LoanVote) private voteRepo: Repository<LoanVote>,
    @InjectRepository(TransferRequest) private transferRepo: Repository<TransferRequest>,
    @InjectRepository(Member) private memberRepo: Repository<Member>,
    @InjectRepository(ActivityLog) private activityRepo: Repository<ActivityLog>,
  ) {}

  async create(
    orgId: number,
    userId: number,
    userName: string,
    dto: CreateLoanRequestDto,
  ): Promise<LoanRequest> {
    const member = await this.memberRepo.findOne({ where: { organizationId: orgId, userId } });
    if (!member) throw new ForbiddenException('Bạn chưa có hồ sơ thành viên trong tổ chức này');

    const existing = await this.loanRepo.findOne({
      where: {
        memberId: member.id,
        organizationId: orgId,
        status: LoanRequestStatus.PENDING_ADMIN,
      },
    });
    if (existing) throw new BadRequestException('Bạn đang có một yêu cầu vay đang chờ duyệt');

    const existing2 = await this.loanRepo.findOne({
      where: {
        memberId: member.id,
        organizationId: orgId,
        status: LoanRequestStatus.PENDING_VOTES,
      },
    });
    if (existing2) throw new BadRequestException('Bạn đang có một yêu cầu vay đang trong giai đoạn bỏ phiếu');

    const request = this.loanRepo.create({
      memberId: member.id,
      organizationId: orgId,
      amount: dto.amount,
      reason: dto.reason,
    });
    const saved = await this.loanRepo.save(request);
    this.logActivity({ userId, userName, action: 'CREATE_LOAN_REQUEST', entityId: saved.id, orgId, metadata: { amount: dto.amount } });
    return saved;
  }

  async findAll(orgId: number, page = 1, limit = 20) {
    const [data, total] = await this.loanRepo.findAndCount({
      where: { organizationId: orgId },
      relations: ['member'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findOne(orgId: number, id: number) {
    const request = await this.loanRepo.findOne({
      where: { id, organizationId: orgId },
      relations: ['member'],
    });
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu vay');

    const votes = await this.voteRepo.find({
      where: { loanRequestId: id },
      relations: ['member'],
    });

    const history = await this.activityRepo.find({
      where: { entityType: 'loan_request', entityId: id, orgId },
      order: { createdAt: 'ASC' },
    });

    return { ...request, votes, history };
  }

  async adminReview(
    orgId: number,
    id: number,
    userId: number,
    userName: string,
    dto: AdminReviewDto,
  ): Promise<LoanRequest> {
    const request = await this.loanRepo.findOne({ where: { id, organizationId: orgId } });
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu vay');
    if (request.status !== LoanRequestStatus.PENDING_ADMIN) {
      throw new BadRequestException('Yêu cầu này không ở trạng thái chờ admin duyệt');
    }

    request.status = dto.approve ? LoanRequestStatus.PENDING_VOTES : LoanRequestStatus.REJECTED_BY_ADMIN;
    request.adminNote = dto.note ?? null;
    request.reviewedBy = userId;
    request.reviewedAt = new Date();

    const saved = await this.loanRepo.save(request);
    this.logActivity({
      userId,
      userName,
      action: dto.approve ? 'LOAN_ADMIN_APPROVED' : 'LOAN_ADMIN_REJECTED',
      entityId: id,
      orgId,
      metadata: { note: dto.note },
    });
    return saved;
  }

  async vote(
    orgId: number,
    id: number,
    userId: number,
    userName: string,
    dto: VoteLoanRequestDto,
  ): Promise<{ message: string }> {
    const request = await this.loanRepo.findOne({ where: { id, organizationId: orgId } });
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu vay');
    if (request.status !== LoanRequestStatus.PENDING_VOTES) {
      throw new BadRequestException('Yêu cầu này không ở trạng thái chờ bỏ phiếu');
    }

    const voter = await this.memberRepo.findOne({ where: { organizationId: orgId, userId } });
    if (!voter) throw new ForbiddenException('Bạn chưa có hồ sơ thành viên trong tổ chức này');

    // Không cho member tự vote request của mình
    if (voter.id === request.memberId) {
      throw new ForbiddenException('Bạn không thể bỏ phiếu cho yêu cầu vay của chính mình');
    }

    const existing = await this.voteRepo.findOne({ where: { loanRequestId: id, memberId: voter.id } });
    if (existing) throw new BadRequestException('Bạn đã bỏ phiếu cho yêu cầu này rồi');

    await this.voteRepo.save(this.voteRepo.create({
      loanRequestId: id,
      memberId: voter.id,
      approve: dto.approve,
      note: dto.note ?? null,
    }));

    this.logActivity({
      userId,
      userName,
      action: dto.approve ? 'LOAN_VOTE_APPROVE' : 'LOAN_VOTE_REJECT',
      entityId: id,
      orgId,
      metadata: { memberId: voter.id, note: dto.note },
    });

    await this.checkVoteResult(orgId, id, request);

    return { message: 'Bỏ phiếu thành công' };
  }

  private async checkVoteResult(orgId: number, loanRequestId: number, request: LoanRequest) {
    const totalMembers = await this.memberRepo.count({ where: { organizationId: orgId } });
    const required = Math.ceil((totalMembers * 2) / 3);

    const allVotes = await this.voteRepo.find({ where: { loanRequestId } });
    const approveCount = allVotes.filter((v) => v.approve).length;
    const rejectCount = allVotes.filter((v) => !v.approve).length;

    const maxPossibleApprove = totalMembers - 1 - rejectCount; // -1 vì requester không vote

    if (approveCount >= required) {
      request.status = LoanRequestStatus.APPROVED;
      await this.loanRepo.save(request);
      await this.transferRepo.save(
        this.transferRepo.create({ loanRequestId, organizationId: orgId, amount: request.amount }),
      );
      this.logActivity({ action: 'LOAN_REQUEST_APPROVED', entityId: loanRequestId, orgId });
    } else if (maxPossibleApprove < required) {
      request.status = LoanRequestStatus.REJECTED_BY_VOTE;
      await this.loanRepo.save(request);
      this.logActivity({ action: 'LOAN_REQUEST_REJECTED_BY_VOTE', entityId: loanRequestId, orgId });
    }
  }

  async getTransferRequests(orgId: number, page = 1, limit = 20) {
    const [data, total] = await this.transferRepo.findAndCount({
      where: { organizationId: orgId },
      relations: ['loanRequest', 'loanRequest.member'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async completeTransfer(orgId: number, transferId: number, userId: number, userName: string) {
    const transfer = await this.transferRepo.findOne({
      where: { id: transferId, organizationId: orgId },
    });
    if (!transfer) throw new NotFoundException('Không tìm thấy yêu cầu chuyển tiền');
    if (transfer.completedAt) throw new BadRequestException('Yêu cầu này đã được hoàn thành');

    transfer.completedBy = userId;
    transfer.completedAt = new Date();
    const saved = await this.transferRepo.save(transfer);
    this.logActivity({
      userId,
      userName,
      action: 'TRANSFER_REQUEST_COMPLETED',
      entityId: transfer.loanRequestId,
      orgId,
      metadata: { transferId },
    });
    return saved;
  }

  private logActivity(params: {
    userId?: number;
    userName?: string;
    action: string;
    entityId?: number;
    orgId: number;
    metadata?: Record<string, unknown>;
  }) {
    this.activityRepo
      .save(
        this.activityRepo.create({
          ...params,
          entityType: 'loan_request',
        }),
      )
      .catch(() => null);
  }
}
