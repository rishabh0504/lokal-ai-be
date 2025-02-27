import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ToolConfigDto, ToolConfigResponseDto } from './dto/tools.dto';
import { plainToInstance } from 'class-transformer';
import { AuthType, ExecutionType, ToolConfig } from '@prisma/client';

@Injectable()
export class ToolsService {
  private readonly logger = new Logger(ToolsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async getAllToolsConfig(): Promise<ToolConfigResponseDto[]> {
    try {
      const toolConfigs: ToolConfig[] =
        await this.prismaService.toolConfig.findMany();
      const llmModelResponseDTOs: ToolConfigResponseDto[] = plainToInstance(
        ToolConfigResponseDto,
        toolConfigs,
      );
      return llmModelResponseDTOs;
    } catch (error: unknown) {
      this.logger.error('Error getting all ToolConfigs', error);
      throw new InternalServerErrorException('Failed to retrieve ToolConfigs');
    }
  }

  async createToolConfig(
    toolConfigDto: ToolConfigDto,
  ): Promise<ToolConfigResponseDto> {
    try {
      const { auth_type, execution_type, ...rest } = toolConfigDto;
      const toolConfig: ToolConfig = await this.prismaService.toolConfig.create(
        {
          data: {
            ...rest,
            auth_type: auth_type as AuthType,
            execution_type: execution_type as ExecutionType,
          },
        },
      );

      return plainToInstance(ToolConfigResponseDto, toolConfig);
    } catch (error: unknown) {
      this.logger.error('Error creating ToolConfig', error);
      throw new InternalServerErrorException('Failed to create ToolConfig');
    }
  }

  async getToolConfigById(id: string): Promise<ToolConfigResponseDto> {
    try {
      const toolConfig: ToolConfig | null =
        await this.prismaService.toolConfig.findUnique({
          where: { id },
        });

      if (!toolConfig) {
        throw new InternalServerErrorException(
          `ToolConfig with ID ${id} not found`,
        );
      }

      return plainToInstance(ToolConfigResponseDto, toolConfig);
    } catch (error: unknown) {
      this.logger.error(`Error getting ToolConfig with ID ${id}`, error);
      throw new InternalServerErrorException(
        `Failed to retrieve ToolConfig with ID ${id}`,
      );
    }
  }

  async updateToolConfig(
    id: string,
    toolConfigDto: ToolConfigDto,
  ): Promise<ToolConfigResponseDto> {
    try {
      const { auth_type, execution_type, ...rest } = toolConfigDto;
      const updatedToolConfig: ToolConfig =
        await this.prismaService.toolConfig.update({
          where: { id },
          data: {
            ...rest,
            auth_type: auth_type as AuthType,
            execution_type: execution_type as ExecutionType,
          },
        });

      return plainToInstance(ToolConfigResponseDto, updatedToolConfig);
    } catch (error: unknown) {
      this.logger.error(`Error updating ToolConfig with ID ${id}`, error);
      throw new InternalServerErrorException(
        `Failed to update ToolConfig with ID ${id}`,
      );
    }
  }

  async deleteToolConfig(id: string): Promise<void> {
    try {
      await this.prismaService.toolConfig.delete({
        where: { id },
      });
    } catch (error: unknown) {
      this.logger.error(`Error deleting ToolConfig with ID ${id}`, error);
      throw new InternalServerErrorException(
        `Failed to delete ToolConfig with ID ${id}`,
      );
    }
  }
}
