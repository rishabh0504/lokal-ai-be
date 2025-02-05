import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';

@Module({
  providers: [AgentService],
  controllers: [AgentController],
  imports: [PrismaModule],
})
export class AgentModule {}
