import {
  Controller,
  Get,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListResponse } from 'ollama';
import { OllamaService } from './ollama.service';

export interface ModelDetails {
  parent_model: string;
  format: string;
  family: string;
  families: string[];
  parameter_size: string;
  quantization_level: string;
}
export interface OllamaLLMModel {
  name: string;
  model: string;
  modified_at: Date;
  size: number;
  digest: string;
  details: ModelDetails;
}

@ApiTags('ai-services')
@Controller('ai-services')
export class OllamaController {
  constructor(private readonly ollamaService: OllamaService) {}

  @Get('models')
  @ApiOperation({ summary: 'Get a list of available Ollama models' })
  @ApiResponse({ status: 200, description: 'List of available models' })
  @ApiResponse({ status: 404, description: 'Error getting models' })
  async getAvailableModels(): Promise<ListResponse> {
    try {
      return await this.ollamaService.getAvailableModels();
    } catch (error: unknown) {
      console.error('Error getting Ollama models:', error); // Log the error

      if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
      ) {
        throw new NotFoundException((error as { message: string }).message);
      } else {
        throw new InternalServerErrorException(
          'Failed to retrieve Ollama models',
        );
      }
    }
  }
}
