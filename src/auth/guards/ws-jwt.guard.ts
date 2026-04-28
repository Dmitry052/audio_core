import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IncomingMessage } from 'http';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const req: IncomingMessage = client.upgradeReq ?? client._socket?.upgradeReq;
    const token = this.extractToken(req);

    if (!token) throw new UnauthorizedException('Missing token');

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
      client.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(req: IncomingMessage | undefined): string | null {
    try {
      const url = new URL(`ws://localhost${req?.url ?? ''}`);
      return url.searchParams.get('token');
    } catch {
      return null;
    }
  }
}
