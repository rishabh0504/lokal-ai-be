import { Controller, UseGuards } from '@nestjs/common';

import {
  Body,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ClerkGuard } from 'src/auth/clerk.guard';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionService } from './session.service';

@ApiTags('sessions')
@Controller('sessions')
@UseGuards(ClerkGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chat session' })
  async create(@Body() createChatSessionDto: CreateSessionDto) {
    return this.sessionService.create(createChatSessionDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all chat sessions for the current user' })
  async findAll(@Param('id') userId: string) {
    return this.sessionService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific chat session' })
  @ApiParam({ name: 'id', description: 'Chat session ID (UUID)' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.sessionService.findOne(id, 'userId');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing chat session' })
  @ApiParam({ name: 'id', description: 'Chat session ID (UUID)' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateChatSessionDto: UpdateSessionDto,
  ) {
    return this.sessionService.update(id, updateChatSessionDto, 'userId');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a chat session' })
  @ApiParam({ name: 'id', description: 'Chat session ID (UUID)' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.sessionService.remove(id, 'userId');
  }
}
