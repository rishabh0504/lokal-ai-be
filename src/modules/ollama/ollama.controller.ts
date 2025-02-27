import {
  Controller,
  Get,
  Logger,
  Param,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LLMModelSetupProcess, LLMModelSetupStatus } from '@prisma/client';
import { ModelResponse } from 'ollama';
import { ClerkAuthGuard } from 'src/auth/clerk-auth-guard';
import { AllExceptionsFilter } from 'src/exception.filter';
import { PrismaService } from 'src/prisma/prisma.service';
import { OllamaService } from './ollama.service';

@ApiTags('ai-services')
@Controller('ai-services')
@UseFilters(AllExceptionsFilter)
@UseGuards(ClerkAuthGuard)
export class OllamaController {
  private readonly logger = new Logger(OllamaController.name);

  constructor(
    private readonly ollamaService: OllamaService,
    private readonly prisma: PrismaService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  @Get('models')
  @ApiOperation({ summary: 'Get a list of available Ollama models' })
  @ApiResponse({ status: 200, description: 'List of available models' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getAvailableModels(): Promise<ModelResponse[]> {
    const response: ModelResponse[] = (
      await this.ollamaService.getAvailableModels()
    ).models;
    return response;
  }

  @Post('models/:modelName/install')
  @ApiOperation({ summary: 'Install an Ollama model' })
  @ApiResponse({ status: 202, description: 'Installation request accepted' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async installModel(@Param('modelName') modelName: string) {
    const setupProcess = await this.prisma.lLMModelSetupProcess.create({
      data: {
        model: modelName,
        status: LLMModelSetupStatus.PENDING,
      },
    });

    this.ollamaService.installModel(modelName);

    this.logger.log(
      `Installation requested for model "${modelName}".  Added to queue. Process ID: ${setupProcess.id}`,
    );

    return {
      message: `Installation requested for model "${modelName}".  Check back later for status.`,
      processId: setupProcess.id,
    };
  }

  @Get('models/install/:processId')
  @ApiOperation({ summary: 'Get the status of a model installation process' })
  @ApiResponse({ status: 200, description: 'Installation process status' })
  @ApiResponse({ status: 404, description: 'Process not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getInstallStatus(
    @Param('processId') processId: string,
  ): Promise<LLMModelSetupProcess> {
    return await this.ollamaService.getModelSetupProcess(processId);
  }

  @Post('models/install/:processId/retry')
  @ApiOperation({ summary: 'Retry a failed model installation' })
  @ApiResponse({ status: 202, description: 'Retry request accepted' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., process not in FAILED state)',
  })
  @ApiResponse({ status: 404, description: 'Process not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async retryInstall(
    @Param('processId') processId: string,
  ): Promise<{ message: string }> {
    await this.ollamaService.retryInstallModel(processId);
    return {
      message: `Retry requested for installation process "${processId}".`,
    };
  }
}
