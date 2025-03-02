import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentModule } from './modules/agent/agent.module';
import { ClerkAuthGuard } from './auth/clerk-auth-guard';
import { ChatModule } from './modules/chat/chat.module';
import { LlmModule } from './modules/llm/llm.module';
import { OllamaModule } from './modules/ollama/ollama.module';
import { PrismaModule } from './prisma/prisma.module';
import { SessionModule } from './modules/session/session.module';
import { ToolsModule } from './modules/tools/tools.module';
import { LokalAICommonModule } from './modules/common/common.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    PrismaModule,
    OllamaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
          ? parseInt(process.env.REDIS_PORT, 10)
          : 6379,
      },
    }),
    AgentModule,
    ChatModule,
    LlmModule,
    SessionModule,
    ToolsModule,
    LokalAICommonModule,
  ],
  controllers: [],
  providers: [ClerkAuthGuard],
})
export class AppModule {}
