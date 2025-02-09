import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Observable, Subject } from 'rxjs';
import { ChatMessage } from '@prisma/client';
import { Ollama } from '@langchain/community/llms/ollama';
import { ConfigService } from '@nestjs/config';

// Define a type for message content to ensure proper string conversion
interface FormattedMessage {
  sender: string;
  content: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private messageStreams: { [sessionId: string]: Subject<ChatMessage> } = {};
  private readonly ollamaBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.ollamaBaseUrl =
      this.configService.get<string>('OLLAMA_HOST') || 'http://localhost:11434';
  }

  getChatMessageStream(sessionId: string): Observable<ChatMessage> {
    if (!this.messageStreams[sessionId]) {
      this.messageStreams[sessionId] = new Subject<ChatMessage>();
    }
    return this.messageStreams[sessionId].asObservable();
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
        take: 10,
      });

      // Save the user's message
      try {
        const userMessage = await this.prisma.chatMessage.create({
          data: {
            sessionId: sessionId,
            content: messageContent,
            sender: chatSession.userId,
            agentId: agentId,
          },
        });
        this.getChatMessageStream(sessionId);
        this.messageStreams[sessionId]?.next(userMessage);
      } catch (dbError) {
        //Prisma.PrismaClientKnownRequestError
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
        numPredict: agent.max_tokens ?? 500, // Maximum 500 tokens
        stop: ['\nUser:', '<|file_separator|>'], // Stop at these delimiters
        repeatPenalty: agent.repeat_penalty ?? 1.1, // Discourage repetition
        repeatLastN: 64, // Analyze the last 64 tokens for repetition
      });

      let fullResponse = '';

      try {
        const stream = await model.stream(prompt);

        for await (const part of stream) {
          fullResponse += part;
        }
      } catch (ollamaError) {
        //Error
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

      try {
        // Save the complete message to the database
        const newMessage = await this.prisma.chatMessage.create({
          data: {
            sessionId: sessionId,
            content: fullResponse, // Save the entire accumulated response
            sender: 'agent',
            agentId: agentId,
          },
        });

        // Stream the complete message to the client
        this.getChatMessageStream(sessionId);
        this.messageStreams[sessionId]?.next(newMessage);
      } catch (dbError) {
        //Prisma.PrismaClientKnownRequestError
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
      throw error; //Let controller handle
    }
  }
}
