import { Ollama } from '@langchain/community/llms/ollama';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage } from '@prisma/client';
import { Subject } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { FormattedMessage, Message, SSEPayload } from './dto/chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private userMessageStreams: { [sessionId: string]: Subject<SSEPayload> } = {};
  private agentMessageStreams: { [sessionId: string]: Subject<SSEPayload> } =
    {};
  private readonly ollamaBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.ollamaBaseUrl =
      this.configService.get<string>('OLLAMA_HOST') || 'http://localhost:11434';
  }

  getUserChatMessageStream(sessionId: string): Subject<SSEPayload> {
    if (!this.userMessageStreams[sessionId]) {
      this.userMessageStreams[sessionId] = new Subject<SSEPayload>();
    }
    return this.userMessageStreams[sessionId];
  }

  getAgentChatMessageStream(sessionId: string): Subject<SSEPayload> {
    if (!this.agentMessageStreams[sessionId]) {
      this.agentMessageStreams[sessionId] = new Subject<SSEPayload>();
    }
    return this.agentMessageStreams[sessionId];
  }

  async sendMessage(
    sessionId: string,
    messageContent: string,
    agentId?: string,
  ): Promise<void> {
    this.logger.log(
      `Starting sendMessage for sessionId: ${sessionId}, agentId: ${agentId}`,
    );

    try {
      const chatSession = await this.prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: { agent: { include: { llmModel: true } } },
      });

      if (!chatSession) {
        this.logger.error(`Chat session not found for id: ${sessionId}`);
        throw new Error('Chat session not found');
      }

      const agent = chatSession.agent;
      if (!agent) {
        this.logger.error(
          `No agent associated with this chat session (ID: ${sessionId})`,
        );
        throw new Error('No agent associated with this chat session.');
      }

      const llmModel = agent.llmModel;
      if (!llmModel) {
        this.logger.error(
          `No LLM model associated with the agent (ID: ${agent.id})`,
        );
        throw new Error('No LLM model associated with the agent.');
      }

      const chatHistory = await this.prisma.chatMessage.findMany({
        where: { sessionId: sessionId },
        orderBy: { created_at: 'asc' },
        take: 3,
      });

      let userMessage: ChatMessage;
      try {
        userMessage = await this.prisma.chatMessage.create({
          data: {
            sessionId: sessionId,
            content: messageContent,
            sender: chatSession.userId,
            agentId: agentId,
          },
        });
        const userMessageStream = this.getUserChatMessageStream(sessionId);
        userMessageStream.next({
          content: userMessage.content as string,
          sender: chatSession.userId,
          done: true,
        });
      } catch (dbError) {
        if (dbError instanceof Error) {
          this.logger.error(
            `Error creating user message in DB: ${dbError.message}`,
            dbError.stack,
          );
        } else {
          this.logger.error(
            `An unknown database error occurred: ${String(dbError)}`,
          );
        }
        return;
      }

      this.logger.log(`sendMessage completed successfully`);
      const formattedHistory = chatHistory
        .map(
          (message): FormattedMessage => ({
            sender: message.sender,
            content: message.content as string,
          }),
        )
        .map(({ sender, content }) => `${sender}: ${content}`)
        .join('\n');

      this.logger.log(`Creating prompt for LLM.`);
      const prompt = `${agent.prompt}.\nHistory: ${formattedHistory}\nUser: ${messageContent}\nAssistant:`;

      this.logger.log(`Calling Ollama API with model: ${llmModel.modelName}`);

      const model = new Ollama({
        baseUrl: this.ollamaBaseUrl,
        model: llmModel.modelName,
        temperature: agent.temperature ?? llmModel.temperatureDefault ?? 0.7,
        topP: agent.top_p ?? llmModel.top_pDefault ?? 0.9,
        numPredict: agent.max_tokens ?? 500,
        stop: ['\nUser:', '<|file_separator|>'],
        repeatPenalty: agent.repeat_penalty ?? 1.1,
        repeatLastN: 64,
      });

      let fullResponse = '';

      try {
        const stream = await model.stream(prompt);
        const agentMessageStream = this.getAgentChatMessageStream(sessionId);

        for await (const part of stream) {
          fullResponse += part;
          agentMessageStream.next({
            content: part,
            sender: 'agent',
            done: false,
          });
        }
        agentMessageStream.next({ content: '', sender: 'agent', done: true });

        try {
          await this.prisma.chatMessage.create({
            data: {
              sessionId: sessionId,
              content: fullResponse,
              sender: 'agent',
              agentId: agentId,
            },
          });
        } catch (dbError) {
          if (dbError instanceof Error) {
            this.logger.error(
              `Error creating chat message in DB: ${dbError.message}`,
              dbError.stack,
            );
          } else {
            this.logger.error(
              `An unknown database error occurred: ${String(dbError)}`,
            );
          }
        }
      } catch (ollamaError) {
        if (ollamaError instanceof Error) {
          this.logger.error(
            `Ollama stream error: ${ollamaError.message}`,
            ollamaError.stack,
          );
        } else {
          this.logger.error(
            `An unknown Ollama error occurred: ${String(ollamaError)}`,
          );
        }
        throw ollamaError;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Error in sendMessage: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `Error in sendMessage: An unknown error occurred: ${String(error)}`,
        );
      }
      throw error;
    }
  }

  async fetchChatHistory(sessionId: string): Promise<Message[]> {
    this.logger.log(`Starting fetching message for sessionId: ${sessionId}`);
    try {
      const chatSession = await this.prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: { agent: { include: { llmModel: true } } },
      });

      if (!chatSession) {
        this.logger.error(`Chat session not found for id: ${sessionId}`);
        throw new Error(`Chat session not found with id: ${sessionId}`);
      }

      const agent = chatSession.agent;
      if (!agent) {
        this.logger.error(
          `No agent associated with this chat session (ID: ${sessionId})`,
        );
        throw new Error(
          `No agent associated with chat session ID ${sessionId}: No agent found`,
        );
      }

      const llmModel = agent.llmModel;
      if (!llmModel) {
        this.logger.error(
          `No LLM model associated with the agent (ID: ${agent.id})`,
        );
        throw new Error(
          `No LLM model associated with agent ID ${agent.id}: No LLM model found`,
        );
      }

      const chatHistory = await this.prisma.chatMessage.findMany({
        where: { sessionId: sessionId },
        orderBy: { created_at: 'asc' },
      });

      const chatHistoryList: Message[] = chatHistory.map(
        (eachItem: ChatMessage) => ({
          done: true,
          sender: eachItem.sender,
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          content: String(eachItem.content || ''),
          id: eachItem.id,
          isAgent: eachItem.sender === 'agent',
        }),
      );
      this.logger.log(
        `Successfully fetched chat history for session ID: ${sessionId}`,
      );
      return chatHistoryList;
    } catch (error: unknown) {
      this.logger.error(
        `Error fetching chat history for session ID ${sessionId}: ${
          (error as Error).message
        }`,
        (error as Error).stack,
      );

      if (
        error instanceof Error &&
        error.message.includes('Chat session not found')
      ) {
        throw error;
      }

      throw new Error(
        `Failed to fetch chat history for session ID ${sessionId}: ${
          error instanceof Error ? error.message : 'An unknown error occurred' // Handle non-Error objects
        }`,
      );
    }
  }
}
