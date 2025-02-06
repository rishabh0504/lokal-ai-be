import { Injectable } from '@nestjs/common';
import * as dns from 'dns';
import { ListResponse, Ollama } from 'ollama';
import { promisify } from 'util';
const dnsLookup = promisify(dns.lookup);
@Injectable()
export class OllamaService {
  private ollama: Ollama;

  constructor() {
    const host = process.env.OLLAMA_HOST;
    this.ollama = new Ollama({
      host: host,
      fetch: async (url, options) => {
        const urlObject = new URL(url);
        if (
          urlObject.hostname === 'localhost' ||
          urlObject.hostname === '::1'
        ) {
          const resolved = await dnsLookup('127.0.0.1', { family: 4 });
          const newUrl = `${urlObject.protocol}//${resolved.address}:${urlObject.port}${urlObject.pathname}`;
          return fetch(newUrl, options);
        }
        return fetch(url, options);
      },
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
