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

@Module({
  imports: [
    PrismaModule,
    OllamaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AgentModule,
    ChatModule,
    LlmModule,
    SessionModule,
    ToolsModule,
  ],
  controllers: [],
  providers: [ClerkAuthGuard],
})
export class AppModule {}
