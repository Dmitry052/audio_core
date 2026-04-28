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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PROXY_REST_TARGET, PROXY_REST_PATH } from '../constants';

interface RawRequest extends Request {
  rawBody?: Buffer;
}

@Controller('proxy')
@UseGuards(JwtAuthGuard)
export class ProxyController {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Proxies a WAV audio stream to the configured backend REST service.
   * Send Content-Type: audio/wav (or application/octet-stream) with raw WAV bytes.
   * The backend response is streamed back to the caller.
   */
  @Post('audio')
  async proxyAudio(@Req() req: RawRequest, @Res() res: Response): Promise<void> {
    const base = this.configService.get<string>('PROXY_REST_TARGET', PROXY_REST_TARGET);
    const path = this.configService.get<string>('PROXY_REST_PATH', PROXY_REST_PATH);
    const url = `${base}${path}`;

    // rawBody is populated by NestFactory.create({ rawBody: true })
    const body = req.rawBody ?? (req.body as Buffer | undefined);

    try {
      const upstream = await axios.post(url, body, {
        headers: {
          'content-type': req.headers['content-type'] ?? 'audio/wav',
          ...(body?.length ? { 'content-length': String(body.length) } : {}),
        },
        responseType: 'stream',
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
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
