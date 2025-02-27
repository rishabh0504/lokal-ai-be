import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMModelSetupStatus } from '@prisma/client';
import * as dns from 'dns';
import { ListResponse, Ollama } from 'ollama';
import { PrismaService } from 'src/prisma/prisma.service';
import { promisify } from 'util';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dnsLookup = promisify(dns.lookup);

@Injectable()
export class OllamaService implements OnModuleInit {
  private ollama: Ollama;
  private readonly logger = new Logger(OllamaService.name);
  private ollamaHost: string;
  private isInstalling = false; // Lock for installModel function
  private installQueue: {
    modelName: string;
    resolve: (value: void | PromiseLike<void>) => void;
    reject: (reason?: any) => void;
  }[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.ollamaHost =
      this.configService.get<string>('OLLAMA_HOST') || 'http://localhost:11434';
  }

  onModuleInit() {
    this.ollama = new Ollama({ host: this.ollamaHost });
    this.logger.log(`Ollama initialized with host: ${this.ollamaHost}`);
  }

  async getAvailableModels(): Promise<ListResponse> {
    try {
      const models: ListResponse = await this.ollama.list();
      this.logger.log(`Successfully fetched available models.`);
      return models;
    } catch (error: unknown) {
      // changed from any
      this.logger.error(`Error fetching models from Ollama:`, error);
      throw error;
    }
  }

  async installModel(modelName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.installQueue.push({ modelName, resolve, reject });
      this.processInstallQueue();
    });
  }

  private async processInstallQueue() {
    if (this.isInstalling) {
      this.logger.debug(
        'Ollama model installation already in progress. Queuing request.',
      );
      return;
    }

    if (this.installQueue.length === 0) {
      return;
    }

    const { modelName, resolve, reject } = this.installQueue.shift()!;
    this.isInstalling = true;

    let setupProcess;
    try {
      // 1. Create a setup process record
      setupProcess = await this.prisma.lLMModelSetupProcess.create({
        data: {
          model: modelName,
          status: LLMModelSetupStatus.PENDING,
        },
      });

      // 2. Update status to IN_PROGRESS
      await this.prisma.lLMModelSetupProcess.update({
        where: { id: setupProcess.id },
        data: { status: LLMModelSetupStatus.IN_PROGRESS },
      });

      // 3. Pull the model
      const pullStream = await this.ollama.pull({
        model: modelName,
        stream: true,
        insecure: true,
      });

      for await (const part of pullStream) {
        if (part.status) {
          this.logger.log(`Pulling ${modelName}: ${part.status}`);
          await this.prisma.lLMModelSetupProcess.update({
            where: { id: setupProcess.id },
            data: { message: `Pulling: ${part.status}` },
          });
        }

        if ('error' in part) {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          this.logger.error(`Error pulling ${modelName}: ${part.error}`);
          await this.prisma.lLMModelSetupProcess.update({
            where: { id: setupProcess.id },
            data: {
              status: LLMModelSetupStatus.FAILED,
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              message: `Error pulling: ${part.error}`,
            },
          });
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          reject(new Error(`Error pulling ${modelName}: ${part.error}`));
          return; // Exit the function on error
        }
      }

      // 4. Update status to COMPLETED
      await this.prisma.lLMModelSetupProcess.update({
        where: { id: setupProcess.id },
        data: {
          status: LLMModelSetupStatus.COMPLETED,
          message: 'Installation complete',
        },
      });

      this.logger.log(`Model "${modelName}" installed successfully.`);
      resolve();
    } catch (error: unknown) {
      // changed from any
      this.logger.error(`Error installing model "${modelName}":`, error);
      if (setupProcess && setupProcess.id) {
        await this.prisma.lLMModelSetupProcess.update({
          where: { id: setupProcess.id },
          data: {
            status: LLMModelSetupStatus.FAILED,
            message: `Installation failed`,
          },
        });
      }
      reject(new Error(`Failed to install model "${modelName}"`));
    } finally {
      this.isInstalling = false;
      this.processInstallQueue(); // Process the next item in the queue
    }
  }

  async getModelSetupProcess(id: string) {
    try {
      const process = await this.prisma.lLMModelSetupProcess.findUnique({
        where: { id },
      });

      if (!process) {
        throw new Error(`Setup process with ID "${id}" not found`);
      }

      return process;
    } catch (error: unknown) {
      this.logger.error(`Error finding setup process with ID "${id}":`, error);
      throw error; // Re-throw, no explicit type.
    }
  }

  async retryInstallModel(processId: string): Promise<void> {
    try {
      const setupProcess = await this.prisma.lLMModelSetupProcess.findUnique({
        where: { id: processId },
      });

      if (!setupProcess) {
        throw new Error(`Setup process with ID "${processId}" not found`);
      }

      if (setupProcess.status !== LLMModelSetupStatus.FAILED) {
        throw new Error(
          `Cannot retry. Process is not in FAILED state. Current state: ${setupProcess.status}`,
        );
      }

      await this.prisma.lLMModelSetupProcess.update({
        where: { id: processId },
        data: { status: LLMModelSetupStatus.PENDING },
      });
      // Re-trigger the installation (e.g., by emitting an event)
      this.logger.log(`Retrying model installation for process ${processId}`);
      this.installModel(setupProcess.model);
    } catch (error: unknown) {
      this.logger.error(`Error retrying model installation:`, error);
      // Update the process to FAILED even on retry failure
      await this.prisma.lLMModelSetupProcess.update({
        where: { id: processId },
        data: {
          status: LLMModelSetupStatus.FAILED,
          message: `Retry failed`,
        },
      });
      throw error; // Re-throw. no explicit type.
    }
  }
}
