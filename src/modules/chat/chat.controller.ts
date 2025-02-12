import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
  Sse,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Observable, catchError, map, merge, throwError } from 'rxjs';
import { ClerkAuthGuard } from 'src/auth/clerk-auth-guard';
import { ChatService } from './chat.service';
import { AuthenticatedRequest } from './dto/auth-request.dto';
import { Message } from './dto/chat.dto';
import { SendMessageDto } from './dto/send-message-dto';

@Controller('chat')
@ApiTags('Chat')
@UseGuards(ClerkAuthGuard)
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
    @Req() req: AuthenticatedRequest,
  ): Observable<{ data: { content: string; done: boolean; sender: string } }> {
    this.logger.log(`SSE connection established for session: ${sessionId}`);

    const userId = req.user.id;

    this.logger.log(`User ID for SSE connection: ${userId}`);

    const userStream = this.chatService
      .getUserChatMessageStream(sessionId)
      .pipe(map((message) => ({ data: message })));

    const agentStream = this.chatService
      .getAgentChatMessageStream(sessionId)
      .pipe(map((message) => ({ data: message })));

    return merge(userStream, agentStream).pipe(
      catchError((err: Error) => {
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
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    this.logger.log(
      `Received message for session ${sessionId}: ${sendMessageDto.message}`,
    );

    const userId = req.user.id;
    this.logger.log(`User ID for message sending: ${userId}`);
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

  @Get(':sessionId/chat-history')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'sessionId',
    type: 'string',
    description: 'Chat Session ID',
  })
  @ApiOperation({
    summary: 'Get Chat history',
  })
  @ApiResponse({
    status: 200,
    description: 'Fetch Chat history',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation errors' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getChatHistory(
    @Param('sessionId') sessionId: string,
  ): Promise<Message[]> {
    this.logger.log(
      `Received request for getting chat history for session ${sessionId}`,
    );

    try {
      this.logger.log(`Message sent to chatService for processing.`);
      return await this.chatService.fetchChatHistory(sessionId);
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
