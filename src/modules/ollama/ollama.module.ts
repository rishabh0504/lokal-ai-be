import { Module } from '@nestjs/common';
import { OllamaService } from './ollama.service';
import { OllamaController } from './ollama.controller';
import { PrismaService } from 'src/prisma/prisma.service'; // Import PrismaService
import { ConfigModule } from '@nestjs/config'; // Import ConfigModule

@Module({
  imports: [ConfigModule],
  providers: [OllamaService, PrismaService],
  exports: [OllamaService],
  controllers: [OllamaController],
})
export class OllamaModule {}
