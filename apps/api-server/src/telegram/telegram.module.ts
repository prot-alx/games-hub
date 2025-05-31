import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
