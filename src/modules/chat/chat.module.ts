import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LokalAICommonModule } from '../common/common.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
  imports: [PrismaModule, LokalAICommonModule, ConfigModule],
})
export class ChatModule {}
