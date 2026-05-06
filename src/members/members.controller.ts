import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateSelfMemberDto } from './dto/update-self-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgMemberGuard } from '../common/guards/org-member.guard';
import { OrgAdminGuard } from '../common/guards/org-admin.guard';
import { OrgSlugGuard } from '../common/guards/org-slug.guard';
import { OrgId } from '../common/decorators/org-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LogsService } from '../logs/logs.service';

@Controller(':orgSlug/members')
export class MembersController {
  constructor(
    private readonly svc: MembersService,
    private readonly logsService: LogsService,
  ) {}

  @UseGuards(OrgSlugGuard)
  @Get()
  findAll(
    @OrgId() orgId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.svc.findAll(
      orgId,
      page ? Number.parseInt(page) : undefined,
      limit ? Number.parseInt(limit) : undefined,
      search,
    );
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard)
  @Get('self')
  async getSelf(
    @OrgId() orgId: number,
    @CurrentUser() user: { userId: number },
  ) {
    const member = await this.svc.findByUserId(orgId, user.userId);
    if (!member) throw new NotFoundException('Không tìm thấy hồ sơ thành viên');
    return member;
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard)
  @Put('self')
  updateSelf(
    @OrgId() orgId: number,
    @CurrentUser() user: { userId: number },
    @Body() dto: UpdateSelfMemberDto,
  ) {
    return this.svc.updateSelf(orgId, user.userId, dto);
  }

  @UseGuards(OrgSlugGuard)
  @Get(':id')
  findOne(@OrgId() orgId: number, @Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(orgId, id);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Post()
  async create(
    @OrgId() orgId: number,
    @Body() dto: CreateMemberDto,
    @CurrentUser() user: { userId: number; username: string },
  ) {
    const member = await this.svc.create(orgId, dto);
    this.logsService.logActivity({
      userId: user.userId,
      userName: user.username,
      action: 'CREATE_MEMBER',
      entityType: 'member',
      entityId: member.id,
      orgId,
      metadata: { name: (member as any).name },
    });
    return member;
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Put(':id')
  async update(
    @OrgId() orgId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: { userId: number; username: string },
  ) {
    const member = await this.svc.update(orgId, id, dto);
    this.logsService.logActivity({
      userId: user.userId,
      userName: user.username,
      action: 'UPDATE_MEMBER',
      entityType: 'member',
      entityId: id,
      orgId,
      metadata: { changes: Object.keys(dto) },
    });
    return member;
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @OrgId() orgId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number; username: string },
  ) {
    await this.svc.remove(orgId, id);
    this.logsService.logActivity({
      userId: user.userId,
      userName: user.username,
      action: 'DELETE_MEMBER',
      entityType: 'member',
      entityId: id,
      orgId,
    });
  }

  // ─── Upload avatar (self) — phải đứng TRƯỚC :id routes ─────────────────────
  @UseGuards(JwtAuthGuard, OrgMemberGuard)
  @Post('self/avatar')
  @UseInterceptors(FileInterceptor('file', makeStorage('avatars')))
  async uploadSelfAvatar(
    @OrgId() orgId: number,
    @CurrentUser() user: { userId: number },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Không có file được tải lên');
    const url = `/uploads/avatars/${file.filename}`;
    return this.svc.updateSelfImageField(orgId, user.userId, 'avatarUrl', url);
  }

  // ─── Upload bank QR (self) — phải đứng TRƯỚC :id routes ─────────────────────
  @UseGuards(JwtAuthGuard, OrgMemberGuard)
  @Post('self/bank-qr')
  @UseInterceptors(FileInterceptor('file', makeStorage('bank-qr')))
  async uploadSelfBankQr(
    @OrgId() orgId: number,
    @CurrentUser() user: { userId: number },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Không có file được tải lên');
    const url = `/uploads/bank-qr/${file.filename}`;
    return this.svc.updateSelfImageField(orgId, user.userId, 'bankQrUrl', url);
  }

  // ─── Admin đổi username / password của member ───────────────────────────────
  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Put(':id/account')
  async updateMemberAccount(
    @OrgId() orgId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { user_name?: string; new_password?: string },
    @CurrentUser() user: { userId: number; username: string },
  ) {
    await this.svc.updateMemberAccount(orgId, id, body);
    this.logsService.logActivity({
      userId: user.userId,
      userName: user.username,
      action: 'UPDATE_MEMBER_ACCOUNT',
      entityType: 'member',
      entityId: id,
      orgId,
      metadata: { changed: Object.keys(body) },
    });
    return { message: 'Cập nhật tài khoản thành công' };
  }

  // ─── Upload avatar (admin cho bất kỳ member) ────────────────────────────────
  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file', makeStorage('avatars')))
  async uploadAvatar(
    @OrgId() orgId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Không có file được tải lên');
    const url = `/uploads/avatars/${file.filename}`;
    return this.svc.updateImageField(orgId, id, 'avatarUrl', url);
  }

  // ─── Upload bank QR (admin cho bất kỳ member) ───────────────────────────────
  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Post(':id/bank-qr')
  @UseInterceptors(FileInterceptor('file', makeStorage('bank-qr')))
  async uploadBankQr(
    @OrgId() orgId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Không có file được tải lên');
    const url = `/uploads/bank-qr/${file.filename}`;
    return this.svc.updateImageField(orgId, id, 'bankQrUrl', url);
  }
}

function makeStorage(folder: string) {
  const dest = join(process.cwd(), 'uploads', folder);
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
  return {
    storage: diskStorage({
      destination: dest,
      filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
      if (!/^image\//.exec(file.mimetype)) {
        return cb(new BadRequestException('Chỉ chấp nhận file ảnh'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  };
}
