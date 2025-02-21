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
import { catchError, map, merge, Observable, throwError } from 'rxjs';
import { ClerkAuthGuard } from 'src/auth/clerk-auth-guard';
import { ChatService } from './chat.service';
import { AuthenticatedRequest } from './dto/auth-request.dto';
import { SendMessageDto } from './dto/send-message-dto';

interface SSEMessageEvent {
  data: any; // More specific type
  // optional id, type and event can be added here if needed
}

interface ChatHistoryItem {
  done: boolean;
  sender: string;
  content: string;
  id: string;
  token_count?: number;
  isAgent: boolean;
}

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
  ): Observable<SSEMessageEvent> {
    this.logger.log(`SSE connection established for session: ${sessionId}`);

    const userId = req.user.id;

    this.logger.log(`User ID for SSE connection: ${userId}`);

    const userStream = this.chatService
      .getUserChatMessageStream(sessionId)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      .pipe(map((message) => ({ data: message })));

    const agentStream = this.chatService
      .getAgentChatMessageStream(sessionId)

      .pipe(
        map((message: string) => ({ data: message })),
        catchError((err: unknown) => {
          let errorMessage = 'An unknown error occurred';
          let errorStack: string | undefined;

          if (err instanceof Error) {
            errorMessage = err.message;
            errorStack = err.stack;
          } else if (typeof err === 'string') {
            errorMessage = err;
          } else {
            errorMessage = JSON.stringify(err); // Safely stringify
          }

          this.logger.error(
            `Error in agent stream: ${errorMessage}`,
            errorStack,
          );

          return throwError(() => ({
            data: { error: errorMessage, done: true, sender: 'agent' },
          })); // Send error to client
        }),
      );

    return merge(userStream, agentStream).pipe(
      catchError((err: unknown) => {
        let errorMessage = 'An unexpected error occurred.';
        let errorStack: string | undefined;

        if (err instanceof Error) {
          errorMessage = err.message;
          errorStack = err.stack;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else {
          errorMessage = JSON.stringify(err);
        }

        this.logger.error(`Error in SSE stream: ${errorMessage}`, errorStack);
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
      let errorStack: string | undefined;

      if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error.stack;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = JSON.stringify(error);
      }

      this.logger.error(`Error sending message: ${errorMessage}`, errorStack);
      throw new Error(errorMessage); // Rethrow as an Error object
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
  ): Promise<ChatHistoryItem[]> {
    this.logger.log(
      `Received request for getting chat history for session ${sessionId}`,
    );

    try {
      this.logger.log(`Message sent to chatService for processing.`);
      // eslint-disable-next-line  @typescript-eslint/no-unsafe-return
      return await this.chatService.fetchChatHistory(sessionId);
    } catch (error: unknown) {
      let errorMessage = 'An unexpected error occurred.';
      let errorStack: string | undefined;

      if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error.stack;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = JSON.stringify(error);
      }

      this.logger.error(
        `Error sending message to chatService: ${errorMessage}`,
        errorStack,
      );
      throw new Error(errorMessage); // Rethrow as an Error object
    }
  }
}
