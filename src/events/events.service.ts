import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Event, EventStatus } from '../entities/event.entity';
import { EventVote } from '../entities/event-vote.entity';
import { Member } from '../entities/member.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventVote) private readonly voteRepo: Repository<EventVote>,
    @InjectRepository(Member) private readonly memberRepo: Repository<Member>,
    private readonly logsService: LogsService,
  ) {}

  async findAll(
    orgId: number,
    userId: number,
    page?: number,
    limit?: number,
    status?: string,
  ) {
    const qb = this.eventRepo
      .createQueryBuilder('e')
      .where('e.organization_id = :orgId', { orgId })
      .orderBy('e.created_at', 'DESC');

    if (status) {
      qb.andWhere('e.status = :status', { status });
    }

    const total = await qb.getCount();
    if (limit && limit > 0) {
      qb.skip(((page ?? 1) - 1) * limit).take(limit);
    }
    const events = await qb.getMany();

    if (events.length === 0) return { data: [], total };

    const eventIds = events.map((e) => e.id);
    const votes = await this.voteRepo
      .createQueryBuilder('v')
      .where('v.event_id IN (:...eventIds)', { eventIds })
      .getMany();

    const votesByEvent = new Map<number, EventVote[]>();
    for (const vote of votes) {
      if (!votesByEvent.has(vote.eventId)) votesByEvent.set(vote.eventId, []);
      votesByEvent.get(vote.eventId)!.push(vote);
    }

    const allVotes = [...votesByEvent.values()].flat();
    const voterNames = await this.resolveVoterNames(orgId, allVotes);
    const data = events.map((event) => this.buildEventResponse(event, votesByEvent.get(event.id) ?? [], userId, voterNames));
    return { data, total };
  }

  async findOne(orgId: number, id: number, userId: number) {
    const event = await this.findEventOrFail(orgId, id);
    const votes = await this.voteRepo.find({ where: { eventId: id } });
    const voterNames = await this.resolveVoterNames(orgId, votes);
    return this.buildEventResponse(event, votes, userId, voterNames);
  }

  async create(
    orgId: number,
    dto: CreateEventDto,
    actor: { userId: number; username: string },
  ) {
    const event = this.eventRepo.create({
      ...dto,
      organizationId: orgId,
      createdBy: actor.userId,
    });
    const saved = await this.eventRepo.save(event);

    this.logsService.logActivity({
      userId: actor.userId,
      userName: actor.username,
      action: 'CREATE_EVENT',
      entityType: 'event',
      entityId: saved.id,
      orgId,
      metadata: { title: dto.title },
    });

    return this.buildEventResponse(saved, [], actor.userId);
  }

  async update(
    orgId: number,
    id: number,
    dto: UpdateEventDto,
    actor: { userId: number; username: string },
  ) {
    const event = await this.findEventOrFail(orgId, id);
    Object.assign(event, dto);
    const saved = await this.eventRepo.save(event);

    this.logsService.logActivity({
      userId: actor.userId,
      userName: actor.username,
      action: 'UPDATE_EVENT',
      entityType: 'event',
      entityId: id,
      orgId,
      metadata: { changes: Object.keys(dto) },
    });

    const votes = await this.voteRepo.find({ where: { eventId: id } });
    const voterNames = await this.resolveVoterNames(orgId, votes);
    return this.buildEventResponse(saved, votes, actor.userId, voterNames);
  }

  async remove(
    orgId: number,
    id: number,
    actor: { userId: number; username: string },
  ): Promise<void> {
    await this.findEventOrFail(orgId, id);
    await this.eventRepo.delete({ id, organizationId: orgId });

    this.logsService.logActivity({
      userId: actor.userId,
      userName: actor.username,
      action: 'DELETE_EVENT',
      entityType: 'event',
      entityId: id,
      orgId,
    });
  }

  async vote(
    orgId: number,
    eventId: number,
    userId: number,
    option: string,
  ) {
    const event = await this.findEventOrFail(orgId, eventId);

    if (event.status === EventStatus.CLOSED) {
      throw new ForbiddenException('Sự kiện đã đóng, không thể bình chọn');
    }
    if (!event.options.includes(option)) {
      throw new BadRequestException('Lựa chọn không hợp lệ');
    }

    let voteRecord = await this.voteRepo.findOne({ where: { eventId, userId } });
    if (voteRecord) {
      voteRecord.option = option;
    } else {
      voteRecord = this.voteRepo.create({ eventId, userId, option });
    }
    await this.voteRepo.save(voteRecord);

    const votes = await this.voteRepo.find({ where: { eventId } });
    const voterNames = await this.resolveVoterNames(orgId, votes);
    return this.buildEventResponse(event, votes, userId, voterNames);
  }

  async cancelVote(orgId: number, eventId: number, userId: number) {
    const event = await this.findEventOrFail(orgId, eventId);

    if (event.status === EventStatus.CLOSED) {
      throw new ForbiddenException('Sự kiện đã đóng');
    }

    await this.voteRepo.delete({ eventId, userId });

    const votes = await this.voteRepo.find({ where: { eventId } });
    const voterNames = await this.resolveVoterNames(orgId, votes);
    return this.buildEventResponse(event, votes, userId, voterNames);
  }

  private async findEventOrFail(orgId: number, id: number): Promise<Event> {
    const event = await this.eventRepo.findOne({ where: { id, organizationId: orgId } });
    if (!event) throw new NotFoundException('Sự kiện không tồn tại');
    return event;
  }

  private async resolveVoterNames(orgId: number, votes: EventVote[]): Promise<Map<number, string>> {
    const userIds = [...new Set(votes.map((v) => v.userId))];
    if (userIds.length === 0) return new Map();
    const members = await this.memberRepo.find({
      where: { organizationId: orgId, userId: In(userIds) },
      select: { userId: true, name: true },
    });
    return new Map(members.filter((m) => m.userId !== null).map((m) => [m.userId, m.name]));
  }

  private buildEventResponse(
    event: Event,
    votes: EventVote[],
    userId: number,
    voterNames: Map<number, string> = new Map(),
  ) {
    const voteCount: Record<string, number> = {};
    for (const opt of event.options) voteCount[opt] = 0;
    for (const vote of votes) {
      voteCount[vote.option] = (voteCount[vote.option] ?? 0) + 1;
    }
    const myVote = votes.find((v) => v.userId === userId)?.option;
    const voters = votes.map((v) => ({
      userId: v.userId,
      name: voterNames.get(v.userId) ?? `Thành viên #${v.userId}`,
      option: v.option,
    }));
    return { ...event, voteCount, myVote, voters };
  }
}
