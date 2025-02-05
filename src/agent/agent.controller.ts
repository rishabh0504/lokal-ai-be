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
import { Agent } from '@prisma/client';
import { AgentService } from './agent.service';
import { AgentDto, AgentResponseDto } from './dto/agent.dto';

@ApiTags('agents')
@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'The agent has been successfully created.',
    type: AgentResponseDto,
  })
  @ApiBody({ type: AgentDto })
  async createAgent(@Body() agent: AgentDto): Promise<Agent> {
    return this.agentService.createAgent(agent);
  }

  @Get()
  @ApiOkResponse({
    description: 'The agents have been successfully retrieved.',
    type: [AgentResponseDto],
  })
  async getAllAgents(): Promise<AgentResponseDto[]> {
    return this.agentService.getAllAgents();
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'The agent has been successfully retrieved.',
    type: AgentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Agent not found.' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  async getAgentById(@Param('id') id: string): Promise<AgentResponseDto> {
    try {
      return await this.agentService.getAgentById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  @Put(':id')
  @ApiOkResponse({
    description: 'The agent has been successfully updated.',
    type: AgentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Agent not found.' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiBody({ type: AgentDto })
  async updateAgent(
    @Param('id') id: string,
    @Body() data: AgentDto,
  ): Promise<AgentResponseDto> {
    try {
      return await this.agentService.updateAgent(id, data);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({ description: 'The agent has been successfully deleted.' })
  @ApiNotFoundResponse({ description: 'Agent not found.' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  async deleteAgent(@Param('id') id: string): Promise<void> {
    try {
      await this.agentService.deleteAgent(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }
}
