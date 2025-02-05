import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { LLMModel } from '@prisma/client';
import { LLMService } from './llm.service';
import { LLMModelDto, LLMModelResponseDto } from './dto/llmmodel.dto';

@ApiTags('llm-models')
@Controller('llm-models')
export class LLMController {
  constructor(private readonly llmService: LLMService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'The LLM model has been successfully created.',
    type: LLMModelDto,
  })
  @ApiBody({ type: LLMModelDto })
  async createLLMModel(@Body() llmModel: LLMModelDto): Promise<LLMModel> {
    return this.llmService.createLLMModel(llmModel);
  }

  @Get()
  @ApiOkResponse({
    description: 'The LLM models have been successfully retrieved.',
    type: [LLMModelResponseDto],
  })
  async getAllLLMModels(): Promise<LLMModelResponseDto[]> {
    return this.llmService.getAllLLMModels();
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'The LLM model has been successfully retrieved.',
    type: LLMModelResponseDto,
  })
  @ApiNotFoundResponse({ description: 'LLM Model not found.' })
  @ApiParam({ name: 'id', description: 'LLM Model ID' })
  async getLLMModelById(@Param('id') id: string): Promise<LLMModelResponseDto> {
    try {
      return await this.llmService.getLLMModelById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  @Put(':id')
  @ApiOkResponse({
    description: 'The LLM model has been successfully updated.',
    type: LLMModelDto,
  })
  @ApiNotFoundResponse({ description: 'LLM Model not found.' })
  @ApiParam({ name: 'id', description: 'LLM Model ID' })
  @ApiBody({ type: LLMModelDto })
  async updateLLMModel(
    @Param('id') id: string,
    @Body() data: LLMModelDto,
  ): Promise<LLMModelResponseDto> {
    try {
      return await this.llmService.updateLLMModel(id, data);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({
    description: 'The LLM model has been successfully deleted.',
  })
  @ApiNotFoundResponse({ description: 'LLM Model not found.' })
  @ApiParam({ name: 'id', description: 'LLM Model ID' })
  async deleteLLMModel(@Param('id') id: string): Promise<void> {
    try {
      await this.llmService.deleteLLMModel(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }
}
