import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Observable, Subject } from 'rxjs';
import { ChatMessage } from '@prisma/client';
import { Ollama } from '@langchain/community/llms/ollama'; // Import Ollama
import { ConfigService } from '@nestjs/config';

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
        take: 10, // Limit history for performance
      });

      const formattedHistory = chatHistory
        .map((message) => `${message.sender}: ${message.content}`)
        .join('\n');

      this.logger.log(`Creating prompt for LLM.`);
      const prompt = `You are a coding assistant. Answer questions concisely with code examples.\nHistory: ${formattedHistory}\nUser: ${messageContent}\nAssistant:`;

      this.logger.log(`Calling Ollama API with model: ${llmModel.modelName}`);

      const model = new Ollama({
        baseUrl: this.ollamaBaseUrl,
        model: llmModel.modelName,
        temperature: agent.temperature ?? llmModel.temperatureDefault ?? 0.7,
        topP: agent.top_p ?? llmModel.top_pDefault ?? 0.9,
      });

      try {
        const stream = await model.stream(prompt); // Use model.stream

        let fullResponse = ''; // to store cumulative response
        for await (const part of stream) {
          fullResponse += part;
          try {
            // Save each chunk to the database
            const newMessage = await this.prisma.chatMessage.create({
              data: {
                sessionId: sessionId,
                content: fullResponse,
                sender: 'agent',
                agentId: agentId,
              },
            });

            this.getChatMessageStream(sessionId);
            this.messageStreams[sessionId]?.next(newMessage);
          } catch (dbError) {
            this.logger.error(`Error creating chat message in DB:`, dbError);
          }
        }
      } catch (ollamaError) {
        this.logger.error(`Ollama stream error:`, ollamaError);
        throw ollamaError; // Re-throw so the controller can handle it appropriately.
      }

      try {
        const userMessage = await this.prisma.chatMessage.create({
          data: {
            sessionId: sessionId,
            content: messageContent,
            sender: 'user',
            agentId: agentId,
          },
        });
        this.getChatMessageStream(sessionId);
        this.messageStreams[sessionId]?.next(userMessage);
      } catch (dbError) {
        this.logger.error(`Error creating user message in DB:`, dbError);
      }

      this.logger.log(`sendMessage completed successfully`);
    } catch (error) {
      this.logger.error(`Error in sendMessage: ${error.message}`, error.stack);
      throw error; //Let controller handle
    }
  }
}
