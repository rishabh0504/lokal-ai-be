import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { OllamaController } from './ollama.controller';
import { OllamaService } from './ollama.service';
import { OllamaInstallProcessor } from './ollama-bull.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ollama-queue',
    }),
  ],
  providers: [OllamaService, OllamaInstallProcessor, ConfigService],
  exports: [OllamaService],
  controllers: [OllamaController],
})
export class OllamaModule {}
