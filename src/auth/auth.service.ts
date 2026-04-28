import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

interface UserRow {
  id: number;
  login: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    // pgcrypto crypt() comparison — never exposes plaintext password to application layer
    const rows = await this.prisma.$queryRaw<UserRow[]>`
      SELECT id, login, role
      FROM "User"
      WHERE login          = ${dto.login}
        AND "passwordHash" = crypt(${dto.password}, "passwordHash")
    `;

    const user = rows[0];
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, login: user.login, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, login: user.login, role: user.role },
    };
  }
}
