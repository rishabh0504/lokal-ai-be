// src/modules/ollama/ollama.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns';
import { ListResponse, Ollama } from 'ollama';
import { promisify } from 'util';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dnsLookup = promisify(dns.lookup);

@Injectable()
export class OllamaService {
  private ollama: Ollama;
  private readonly logger = new Logger(OllamaService.name);

  constructor() {
    const host = process.env.OLLAMA_HOST;
    this.ollama = new Ollama({
      host: host,
    });
  }

  async getAvailableModels(): Promise<ListResponse> {
    try {
      const models: ListResponse = await this.ollama.list();
      return models;
    } catch (error: unknown) {
      this.logger.error('Error fetching models from Ollama:', error);
      if (error instanceof Error) {
        throw new Error(`Error fetching models: ${error.message}`);
      } else {
        // Handle cases where error is not an Error object
        throw new Error('An unknown error occurred while fetching models.');
      }
    }
  }

  async pullModel(modelName: string): Promise<void> {
    // Renamed method for clarity
    try {
      this.logger.log(`Pulling model ${modelName}`);
      await this.ollama.pull({ model: modelName, stream: false });
      this.logger.log(`Successfully pulled model ${modelName}`);
    } catch (error: unknown) {
      this.logger.error(`Error installing model ${modelName}:`, error);
      if (error instanceof Error) {
        throw new Error(
          `Error installing model ${modelName}: ${error.message}`,
        );
      } else {
        // Handle cases where error is not an Error object
        throw new Error('An unknown error occurred while installing model.');
      }
    }
  }

  async removeModel(modelName: string): Promise<void> {
    // Renamed method for clarity
    try {
      this.logger.log(`Removing model ${modelName}`);
      await this.ollama.delete({ model: modelName });
      this.logger.log(`Successfully removed  model ${modelName}`);
    } catch (error: unknown) {
      this.logger.error(`Error removing model ${modelName}:`, error);
      if (error instanceof Error) {
        throw new Error(`Error removing model ${modelName}: ${error.message}`);
      } else {
        // Handle cases where error is not an Error object
        throw new Error('An unknown error occurred while removing model.');
      }
    }
  }
}
