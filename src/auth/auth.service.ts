import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(RefreshToken) private tokenRepo: Repository<RefreshToken>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const secret = this.config.get<string>('REGISTRATION_SECRET');
    if (dto.registration_secret !== secret) {
      throw new ForbiddenException('Invalid registration secret');
    }

    const exists = await this.userRepo.findOne({ where: { user_name: dto.user_name } });
    if (exists) throw new ConflictException('Username already taken');

    const hash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      user_name: dto.user_name,
      password: hash,
      display_name: dto.display_name ?? dto.user_name,
    });
    const saved = await this.userRepo.save(user);
    const { password, ...safe } = saved;
    return safe;
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { user_name: dto.user_name } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user);
  }

  async refresh(userId: string, rawRefreshToken: string) {
    const tokens = await this.tokenRepo.find({
      where: { userId, revoked: false },
    });

    let matched: RefreshToken | null = null;
    for (const t of tokens) {
      if (new Date() > t.expiresAt) continue;
      const match = await bcrypt.compare(rawRefreshToken, t.tokenHash);
      if (match) {
        matched = t;
        break;
      }
    }

    if (!matched) throw new ForbiddenException('Refresh token invalid or expired');

    matched.revoked = true;
    await this.tokenRepo.save(matched);

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');

    return this.generateTokens(user);
  }

  async logout(userId: string) {
    await this.tokenRepo.update({ userId, revoked: false }, { revoked: true });
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const { password, ...safe } = user;
    return safe;
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, username: user.user_name };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });

    const refreshTokenPlain = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    const tokenHash = await bcrypt.hash(refreshTokenPlain, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const rt = this.tokenRepo.create({ userId: user.id, tokenHash, expiresAt });
    await this.tokenRepo.save(rt);

    return {
      accessToken,
      refreshToken: refreshTokenPlain,
      user: { id: user.id, user_name: user.user_name, display_name: user.display_name },
    };
  }
}
