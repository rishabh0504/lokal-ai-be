import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { OllamaService } from './ollama.service';

@Processor('ollama-queue')
export class OllamaInstallProcessor {
  private readonly logger = new Logger(OllamaInstallProcessor.name);

  constructor(private readonly ollamaService: OllamaService) {}

  @Process()
  async installModel(job: Job<{ modelName: string; action: string }>) {
    const { modelName, action } = job.data;
    this.logger.log(
      `Starting ${action} of model ${modelName} (Job ID: ${job.id})`,
    );
    try {
      if (action === 'INSTALL_MODEL') {
        await this.ollamaService.pullModel(modelName);
      } else if (action === 'UNINSTALL_MODEL') {
        await this.ollamaService.removeModel(modelName);
      }
      this.logger.log(
        `Installation of model ${modelName} completed. (Job ID: ${job.id})`,
      );
    } catch (error: any) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Installation of model ${modelName} failed: ${error.message} (Job ID: ${job.id})`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.stack,
      );
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Installation failed for model ${modelName}: ${error.message}`,
      );
    }
  }
}
