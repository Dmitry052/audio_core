import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { ProxyGateway } from './proxy.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProxyController],
  providers: [ProxyGateway],
})
export class ProxyModule {}
