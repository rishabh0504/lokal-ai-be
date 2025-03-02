import { InjectQueue } from '@nestjs/bull';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Queue } from 'bull';
import { ModelResponse } from 'ollama';
import { ModelInstallResponse } from './dto/model.dto';
import { OllamaService } from './ollama.service';

@ApiTags('ollama-services')
@Controller('ollama-services')
// @UseGuards(ClerkAuthGuard)
export class OllamaController {
  private readonly logger = new Logger(OllamaController.name);

  constructor(
    @InjectQueue('ollama-queue') private readonly queue: Queue,
    private readonly ollamaService: OllamaService,
  ) {}

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
  @Post('models/:modelName/install')
  @ApiOperation({ summary: 'Install an Ollama model (background)' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Installation request accepted',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal Server Error',
  })
  @HttpCode(HttpStatus.ACCEPTED) // Explicitly set the 202 Accepted status code
  async installModel(
    @Param('modelName') modelName: string,
  ): Promise<ModelInstallResponse> {
    try {
      this.logger.log(`Installation requested for model: ${modelName}`);

      // Add the installation job to the queue
      const job = await this.queue.add({ modelName, action: 'INSTALL_MODEL' }); // Pass model name as job data

      this.logger.log(
        `Installation job added to queue for model: ${modelName} (Job ID: ${job.id})`,
      );

      return {
        message: `Installation requested for model "${modelName}". Check back later for status.`,
        processId: job.id.toString(), // Return Bull's job ID
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error adding installation job to queue for model ${modelName}:`,
        error,
      );
      throw new InternalServerErrorException(
        `Failed to add installation job to queue for model ${modelName}. See server logs for details.`,
      );
    }
  }

  @Delete('models/:modelName') // DELETE request to remove
  @ApiOperation({ summary: 'Remove an Ollama model (background)' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Removal request accepted',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal Server Error',
  })
  @HttpCode(HttpStatus.ACCEPTED) // 202 Accepted is suitable here
  async removeModel(
    @Param('modelName') modelName: string,
  ): Promise<ModelInstallResponse> {
    // Use same response type for consistency
    try {
      this.logger.log(`Removal requested for model: ${modelName}`);

      // Add the removal job to the queue
      const job = await this.queue.add({
        modelName,
        action: 'UNINSTALL_MODEL',
      }); // Pass model name as job data

      this.logger.log(
        `Removal job added to queue for model: ${modelName} (Job ID: ${job.id})`,
      );

      return {
        message: `Removal requested for model "${modelName}". Check back later for status.`,
        processId: job.id.toString(), // Return Bull's job ID
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error adding removal job to queue for model ${modelName}:`,
        error,
      );
      throw new InternalServerErrorException(
        `Failed to add removal job to queue for model ${modelName}. See server logs for details.`,
      );
    }
  }
}
