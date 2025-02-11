import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LLMController } from './llm.controller';
import { LLMService } from './llm.service';

@Module({
  providers: [LLMService],
  controllers: [LLMController],
  imports: [PrismaModule],
})
export class LlmModule {}
