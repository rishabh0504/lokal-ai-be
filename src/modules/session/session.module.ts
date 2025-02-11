import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';

@Module({
  providers: [SessionService],
  controllers: [SessionController],
  imports: [PrismaModule],
})
export class SessionModule {}
