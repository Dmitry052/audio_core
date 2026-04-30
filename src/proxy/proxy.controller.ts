import {
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';
import { Agent } from 'http';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PROXY_REST_TARGET, PROXY_REST_PATH } from '../constants';

@Controller('proxy')
@UseGuards(JwtAuthGuard)
export class ProxyController {
  private readonly url: string;
  private readonly httpAgent = new Agent({ keepAlive: true, maxSockets: 50 });

  constructor(configService: ConfigService) {
    const base = configService.get<string>('PROXY_REST_TARGET', PROXY_REST_TARGET);
    const path = configService.get<string>('PROXY_REST_PATH', PROXY_REST_PATH);
    this.url = `${base}${path}`;
  }

  /**
   * Pipes the incoming audio stream directly to the upstream backend without buffering.
   * This avoids holding large WAV files in memory under high concurrency.
   */
  @Post('audio')
  async proxyAudio(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const upstream = await axios.post(this.url, req, {
        headers: {
          'content-type': req.headers['content-type'] ?? 'audio/wav',
          ...(req.headers['content-length']
            ? { 'content-length': req.headers['content-length'] }
            : { 'transfer-encoding': 'chunked' }),
        },
        responseType: 'stream',
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 30_000,
        httpAgent: this.httpAgent,
      });

      res.status(upstream.status);
      for (const [key, value] of Object.entries(upstream.headers)) {
        if (value !== undefined) {
          res.setHeader(key, value as string | string[]);
        }
      }
      (upstream.data as NodeJS.ReadableStream).pipe(res);
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response) {
        res.status(axiosErr.response.status).json({ message: 'Upstream error' });
      } else {
        throw new BadGatewayException('Backend unreachable');
      }
    }
  }
}
