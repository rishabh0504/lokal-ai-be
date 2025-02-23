import {
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ModelResponse } from 'ollama';
import { ClerkAuthGuard } from 'src/auth/clerk-auth-guard';
import { OllamaService } from './ollama.service';

@ApiTags('ai-services')
@Controller('ai-services')
// @UseGuards(ClerkAuthGuard)
export class OllamaController {
  constructor(private readonly ollamaService: OllamaService) {}

  @Get('models')
  @ApiOperation({ summary: 'Get a list of available Ollama models' })
  @ApiResponse({ status: 200, description: 'List of available models' })
  @ApiResponse({ status: 404, description: 'Error getting models' })
  async getAvailableModels(): Promise<ModelResponse[]> {
    try {
      const response: ModelResponse[] = (
        await this.ollamaService.getAvailableModels()
      ).models;
      return response;
    } catch (error: unknown) {
      console.error('Error getting Ollama models:', error);

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
