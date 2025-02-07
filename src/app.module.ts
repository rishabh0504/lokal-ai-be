import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { OllamaModule } from './ollama/ollama.module';
import { ConfigModule } from '@nestjs/config';
import { AgentModule } from './agent/agent.module';
import { ChatModule } from './chat/chat.module';
import { LlmModule } from './llm/llm.module';
import { SessionModule } from './session/session.module';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
