import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import { WS_PORT, PROXY_WS_TARGET } from '../constants';

@WebSocketGateway(WS_PORT, { path: '/ws/proxy' })
export class ProxyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ProxyGateway.name);
  private readonly backends = new Map<WebSocket, WebSocket>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: WebSocket, request: IncomingMessage): void {
    const token = this.extractToken(request);
    if (!token || !this.verifyToken(token)) {
      this.logger.warn('WS connection rejected — invalid or missing token');
      client.close(1008, 'Unauthorized');
      return;
    }

    const target = this.configService.get<string>('PROXY_WS_TARGET', PROXY_WS_TARGET);
    const backend = new WebSocket(target);

    backend.on('open', () => {
      this.logger.log(`WS backend connected: ${target}`);
    });

    backend.on('message', (data: WebSocket.RawData, isBinary: boolean) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });

    backend.on('close', (code: number, reason: Buffer) => {
      if (client.readyState !== WebSocket.CLOSED) {
        client.close(code, reason.toString());
      }
    });

    backend.on('error', (err: Error) => {
      this.logger.error(`WS backend error: ${err.message}`);
      if (client.readyState === WebSocket.OPEN) {
        client.close(1011, 'Backend error');
      }
    });

    // Forward client messages to backend
    client.on('message', (data: WebSocket.RawData, isBinary: boolean) => {
      if (backend.readyState === WebSocket.OPEN) {
        backend.send(data, { binary: isBinary });
      }
    });

    this.backends.set(client, backend);
  }

  handleDisconnect(client: WebSocket): void {
    const backend = this.backends.get(client);
    if (backend && backend.readyState !== WebSocket.CLOSED) {
      backend.close();
    }
    this.backends.delete(client);
  }

  private extractToken(request: IncomingMessage): string | null {
    try {
      const url = new URL(`ws://localhost${request.url ?? ''}`);
      return url.searchParams.get('token');
    } catch {
      return null;
    }
  }

  private verifyToken(token: string): boolean {
    try {
      this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
      return true;
    } catch {
      return false;
    }
  }
}
