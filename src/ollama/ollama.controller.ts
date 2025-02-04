import { Controller, Get, NotFoundException } from '@nestjs/common';
import { OllamaService } from './ollama.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListResponse } from 'ollama';

@ApiTags('ai-services')
@Controller('ai-services')
export class OllamaController {
  constructor(private readonly ollamaService: OllamaService) {}

  @Get('models')
  @ApiOperation({ summary: 'Get a list of available Ollama models' })
  @ApiResponse({ status: 200, description: 'List of available models' })
  @ApiResponse({ status: 404, description: 'Error getting models' })
  async getAvailableModels(): Promise<any> {
    try {
      return await this.ollamaService.getAvailableModels();
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}
