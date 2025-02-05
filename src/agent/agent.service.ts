import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Agent } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';
import { AgentDto, AgentResponseDto } from './dto/agent.dto';

@Injectable()
export class AgentService {
  constructor(private prisma: PrismaService) {}

  async createAgent(agent: AgentDto): Promise<Agent> {
    try {
      return await this.prisma.agent.create({ data: agent });
    } catch (error) {
      console.error('Error creating agent:', error);
      throw new InternalServerErrorException('Failed to create agent');
    }
  }

  async getAllAgents(): Promise<AgentResponseDto[]> {
    try {
      const agents: Agent[] = await this.prisma.agent.findMany();
      const agentResponseDTOs: AgentResponseDto[] = plainToInstance(
        AgentResponseDto,
        agents,
      );
      return agentResponseDTOs;
    } catch (error) {
      console.error('Error getting all agents:', error);
      throw new InternalServerErrorException('Failed to retrieve agents');
    }
  }

  async getAgentById(id: string): Promise<AgentResponseDto> {
    try {
      const agent = await this.prisma.agent.findUnique({ where: { id } });
      if (!agent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }
      const agentResponseDTO: AgentResponseDto = plainToInstance(
        AgentResponseDto,
        agent,
      );
      return agentResponseDTO;
    } catch (error) {
      console.error('Error getting agent by ID:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve agent');
    }
  }

  async updateAgent(id: string, data: AgentDto): Promise<AgentResponseDto> {
    try {
      const agent = await this.prisma.agent.update({
        where: { id },
        data,
      });

      if (!agent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }
      const agentResponseDTO: AgentResponseDto = plainToInstance(
        AgentResponseDto,
        agent,
      );
      return agentResponseDTO;
    } catch (error) {
      console.error('Error updating agent:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update agent');
    }
  }

  async deleteAgent(id: string): Promise<void> {
    try {
      const agent = await this.prisma.agent.delete({
        where: { id },
      });
      if (!agent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }
      return;
    } catch (error) {
      console.error('Error deleting agent:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete agent');
    }
  }
}
