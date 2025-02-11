import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createChatSessionDto: CreateSessionDto) {
    return this.prisma.chatSession.create({
      data: {
        ...createChatSessionDto,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const chatSession = await this.prisma.chatSession.findUnique({
      where: { id },
    });

    if (!chatSession) {
      throw new NotFoundException(`Chat session with ID ${id} not found`);
    }

    if (chatSession.userId !== userId) {
      throw new UnauthorizedException(
        'Unauthorized to access this chat session',
      );
    }

    return chatSession;
  }

  async update(
    id: string,
    updateChatSessionDto: UpdateSessionDto,
    userId: string,
  ) {
    await this.findOne(id, userId);

    return this.prisma.chatSession.update({
      where: { id },
      data: updateChatSessionDto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.chatSession.delete({
      where: { id },
    });
  }
}
