import { Injectable } from '@nestjs/common';
import { ListResponse, Ollama } from 'ollama';

@Injectable()
export class OllamaService {
  private ollama: Ollama;

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
      console.error('Error fetching models from Ollama:', error);
      if (error instanceof Error) {
        throw new Error(`Error fetching models: ${error.message}`);
      } else {
        // Handle cases where error is not an Error object
        throw new Error('An unknown error occurred while fetching models.');
      }
    }
  }
}
