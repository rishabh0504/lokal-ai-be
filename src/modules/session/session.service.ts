import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createChatSessionDto: CreateSessionDto, userId: string) {
    try {
      let chatSession = await this.prisma.chatSession.create({
        data: {
          ...createChatSessionDto,
          userId,
        },
      });

      chatSession = await this.prisma.chatSession.update({
        data: {
          title: `${chatSession.id}`,
        },
        where: {
          id: chatSession.id,
        },
      });

      return chatSession;
    } catch (error: unknown) {
      this.logger.error('Error creating chat session', error);
      throw error;
    }
  }

  async findAll(userId: string) {
    try {
      return this.prisma.chatSession.findMany({
        where: { userId },
        orderBy: { created_at: 'desc' },
      });
    } catch (error: unknown) {
      this.logger.error('Error finding all chat sessions', error);
      throw error;
    }
  }

  async findOne(id: string, userId: string) {
    try {
      const chatSession = await this.prisma.chatSession.findUnique({
        where: { id },
      });

      if (!chatSession) {
        throw new Error(`Chat session with ID ${id} not found`);
      }

      if (chatSession.userId !== userId) {
        throw new Error('Unauthorized to access this chat session');
      }

      return chatSession;
    } catch (error: unknown) {
      this.logger.error(`Error finding chat session with ID ${id}`, error);
      throw error;
    }
  }

  async update(
    id: string,
    updateChatSessionDto: UpdateSessionDto,
    userId: string,
  ) {
    try {
      await this.findOne(id, userId);

      return this.prisma.chatSession.update({
        where: { id },
        data: updateChatSessionDto,
      });
    } catch (error: unknown) {
      this.logger.error(`Error updating chat session with ID ${id}`, error);
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    try {
      await this.findOne(id, userId);

      return this.prisma.chatSession.delete({
        where: { id },
      });
    } catch (error: unknown) {
      this.logger.error(`Error removing chat session with ID ${id}`, error);
      throw error;
    }
  }
}
