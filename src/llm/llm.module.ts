import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { LLMController } from './llm.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [LLMService],
  controllers: [LLMController],
  imports: [PrismaModule],
})
export class LlmModule {}
