import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Sse,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChatMessage } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ChatService } from './chat.service';

class SendMessageDto {
  @ApiProperty({
    description: 'Message content',
    example: 'Hello, how are you?',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Agent ID (optional)',
    example: 'agent456',
    required: false,
  })
  @IsOptional()
  @IsString()
  agentId?: string;
}

@Controller('chat')
@ApiTags('Chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  constructor(private readonly chatService: ChatService) {}

  @Get(':sessionId/stream')
  @Sse(':sessionId/stream')
  @ApiParam({
    name: 'sessionId',
    type: 'string',
    description: 'Chat Session ID',
  })
  @ApiOperation({ summary: 'Establish SSE connection for a chat session' })
  @ApiResponse({
    status: 200,
    description: 'SSE stream of chat messages',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          description: 'Chat message data',
        },
      },
    },
  })
  sse(
    @Param('sessionId') sessionId: string,
  ): Observable<{ data: ChatMessage }> {
    this.logger.log(`SSE connection established for session: ${sessionId}`);
    return this.chatService.getChatMessageStream(sessionId).pipe(
      map((message: ChatMessage) => ({ data: message })),
      catchError((err: Error) => {
        //Type the err
        this.logger.error(`Error in SSE stream: ${err.message}`, err.stack);
        return throwError(() => new Error('SSE stream error'));
      }),
    );
  }

  @Post(':sessionId/message')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'sessionId',
    type: 'string',
    description: 'Chat Session ID',
  })
  @ApiBody({ type: SendMessageDto })
  @ApiOperation({
    summary:
      'Send a message to a chat session and receive streaming responses via SSE',
  })
  @ApiResponse({
    status: 200,
    description:
      'Message sent successfully, streaming responses will be sent via SSE',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation errors' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<void> {
    this.logger.log(
      `Received message for session ${sessionId}: ${sendMessageDto.message}`,
    );
    try {
      await this.chatService.sendMessage(
        sessionId,
        sendMessageDto.message,
        sendMessageDto.agentId,
      );
      this.logger.log(`Message sent to chatService for processing.`);
    } catch (error: unknown) {
      let errorMessage = 'An unexpected error occurred.';
      let errorStack: string | undefined = undefined;
      if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error.stack;
      } else {
        errorMessage = String(error);
      }
      this.logger.error(
        `Error sending message to chatService: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
