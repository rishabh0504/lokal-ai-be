import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { LLMModel } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';
import { LLMModelDto, LLMModelResponseDto } from './dto/llmmodel.dto';
import { InputJsonValue } from '@prisma/client/runtime/library';

@Injectable()
export class LLMService {
  constructor(private prisma: PrismaService) {}

  async createLLMModel(llmModel: LLMModelDto): Promise<LLMModel> {
    try {
      // Parse stop_sequences from JSON string to JSON object before creating the model
      const data: Omit<LLMModelDto, 'stop_sequences'> & {
        stop_sequences?: InputJsonValue;
      } = { ...llmModel };
      if (llmModel.stop_sequences) {
        try {
          const parsed = JSON.parse(llmModel.stop_sequences) as InputJsonValue; // Explicit assertion
          data.stop_sequences = parsed;
        } catch (err) {
          console.error('Invalid JSON format for stop_sequences', err);
          throw new InternalServerErrorException(
            'Invalid JSON format for stop_sequences',
          );
        }
      }

      return await this.prisma.lLMModel.create({ data: data });
    } catch (error) {
      console.error('Error creating LLM model:', error);
      throw new InternalServerErrorException('Failed to create LLM model');
    }
  }

  async getAllLLMModels(): Promise<LLMModelResponseDto[]> {
    try {
      const llmModels: LLMModel[] = await this.prisma.lLMModel.findMany();
      const llmModelResponseDTOs: LLMModelResponseDto[] = plainToInstance(
        LLMModelResponseDto,
        llmModels,
      );
      return llmModelResponseDTOs;
    } catch (error) {
      console.error('Error getting all LLM models:', error);
      throw new InternalServerErrorException('Failed to retrieve LLM models');
    }
  }

  async getLLMModelById(id: string): Promise<LLMModelResponseDto> {
    try {
      const llmModel = await this.prisma.lLMModel.findUnique({ where: { id } });
      if (!llmModel) {
        throw new NotFoundException(`LLM Model with ID ${id} not found`);
      }
      const llmModelResponseDTO: LLMModelResponseDto = plainToInstance(
        LLMModelResponseDto,
        llmModel,
      );
      return llmModelResponseDTO;
    } catch (error) {
      console.error('Error getting LLM model by ID:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve LLM model');
    }
  }

  async updateLLMModel(
    id: string,
    data: LLMModelDto,
  ): Promise<LLMModelResponseDto> {
    try {
      // Parse stop_sequences from JSON string to JSON object before updating the model
      const updateData: Omit<LLMModelDto, 'stop_sequences'> & {
        stop_sequences?: InputJsonValue;
      } = { ...data };
      if (data.stop_sequences) {
        try {
          const parsed = JSON.parse(data.stop_sequences) as InputJsonValue; // Explicit assertion
          updateData.stop_sequences = parsed;
        } catch (err) {
          console.error('Invalid JSON format for stop_sequences', err);
          throw new InternalServerErrorException(
            'Invalid JSON format for stop_sequences',
          );
        }
      }

      const llmModel = await this.prisma.lLMModel.update({
        where: { id },
        data: updateData,
      });

      if (!llmModel) {
        throw new NotFoundException(`LLM Model with ID ${id} not found`);
      }
      const llmModelResponseDTO: LLMModelResponseDto = plainToInstance(
        LLMModelResponseDto,
        llmModel,
      );
      return llmModelResponseDTO;
    } catch (error) {
      console.error('Error updating LLM model:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update LLM model');
    }
  }

  async deleteLLMModel(id: string): Promise<LLMModel> {
    try {
      const llmModel = await this.prisma.lLMModel.delete({
        where: { id },
      });
      if (!llmModel) {
        throw new NotFoundException(`LLM Model with ID ${id} not found`);
      }
      return llmModel;
    } catch (error) {
      console.error('Error deleting LLM model:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete LLM model');
    }
  }
}
