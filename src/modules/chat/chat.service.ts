import { Ollama } from '@langchain/ollama';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage } from '@prisma/client';
import { encode } from 'gpt-tokenizer'; //changed gpt tokenizer
import { Subject } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { FormattedMessage } from './dto/chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private userMessageStreams: { [sessionId: string]: Subject<any> } = {};
  private agentMessageStreams: { [sessionId: string]: Subject<any> } = {};
  private readonly ollamaBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.ollamaBaseUrl =
      this.configService.get<string>('OLLAMA_HOST') || 'http://localhost:11434';
  }

  getUserChatMessageStream(sessionId: string): Subject<any> {
    if (!this.userMessageStreams[sessionId]) {
      this.userMessageStreams[sessionId] = new Subject<any>();
    }
    return this.userMessageStreams[sessionId];
  }

  getAgentChatMessageStream(sessionId: string): Subject<any> {
    if (!this.agentMessageStreams[sessionId]) {
      this.agentMessageStreams[sessionId] = new Subject<any>();
    }
    return this.agentMessageStreams[sessionId];
  }

  private getTokenCount(text: string): number {
    try {
      const encoded = encode(text);
      return encoded.length;
    } catch (error) {
      this.logger.error('Error tokenizing text:', error);
      return 0; // Or throw the error if you want to handle it upstream
    }
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
      const userTokenCount = this.getTokenCount(messageContent);
      try {
        userMessage = await this.prisma.chatMessage.create({
          data: {
            sessionId: sessionId,
            content: messageContent,
            sender: chatSession.userId,
            agentId: agentId,
          },
        });

        //Update the tokens
        await this.prisma.chatSession.update({
          where: { id: sessionId },
          data: {
            token_count: {
              increment: userTokenCount,
            },
          },
        });

        const userMessageStream = this.getUserChatMessageStream(sessionId);
        userMessageStream.next({
          content: userMessage.content,
          sender: chatSession.userId,
          done: true,
        });
      } catch (dbError: any) {
        this.logger.error(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          `Error creating user message in DB: ${dbError?.message}`,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          dbError?.stack,
        );
        return undefined;
      }

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
        topK: agent.top_k ?? llmModel.top_kDefault ?? 40,
        numCtx: agent.max_tokens ?? llmModel.max_tokensDefault ?? 256,
        presencePenalty:
          agent.presence_penalty ?? llmModel.presence_penaltyDefault ?? 0.0,
        frequencyPenalty:
          agent.frequency_penalty ?? llmModel.frequency_penaltyDefault ?? 0.0,
        stop: ['\nUser:', '<|file_separator|>'],
        repeatPenalty:
          agent.repeat_penalty ?? llmModel.repeat_penaltyDefault ?? 1.0,
        repeatLastN: 64,
      });

      let fullResponse = '';
      try {
        const agentMessageStream = this.getAgentChatMessageStream(sessionId);

        const stream = await model.stream(prompt);

        for await (const part of stream) {
          fullResponse += part;
          agentMessageStream.next({
            content: part,
            sender: 'agent',
            done: false,
          });
        }

        agentMessageStream.next({ content: '', sender: 'agent', done: true }); // Signal completion
      } catch (ollamaError: any) {
        this.logger.error(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          `Ollama stream error: ${ollamaError?.message}`,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          ollamaError?.stack,
        );
        const agentMessageStream = this.getAgentChatMessageStream(sessionId);
        agentMessageStream.error(ollamaError);
        throw ollamaError;
      }
      const agentTokenCount = this.getTokenCount(fullResponse); //Add agentTokenCount

      //Update the tokens for the new message that got sent
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          token_count: {
            increment: agentTokenCount,
          },
        },
      });

      try {
        await this.prisma.chatMessage.create({
          data: {
            sessionId: sessionId,
            content: fullResponse,
            sender: 'agent',
            agentId: agentId,
          },
        });
      } catch (dbError: any) {
        this.logger.error(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          `Error creating agent message in DB: ${dbError.message}`,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          dbError.stack,
        );
      }
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Error in sendMessage: ${error.message}`, error.stack);
      throw error;
    }
  }
  async fetchChatHistory(sessionId: string): Promise<any[]> {
    //Type the  Promise to be any
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
          `No token count`,
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

      const chatHistoryList = chatHistory.map((eachItem: ChatMessage) => ({
        done: true,
        sender: eachItem.sender,
        content: eachItem.content || '',
        id: eachItem.id,
        isAgent: eachItem.sender === 'agent',
      }));
      this.logger.log(
        `Successfully fetched chat history for session ID: ${sessionId}`,
      );

      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          token_count: chatSession?.token_count,
        },
      });

      return chatHistoryList;
    } catch (error: any) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Error fetching chat history for session ID ${sessionId}: ${error.message}`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.stack,
      );

      if (
        error instanceof Error &&
        error.message.includes('Chat session not found')
      ) {
        throw error;
      }

      throw new Error(
        `Failed to fetch chat history for session ID ${sessionId}: ${
          error instanceof Error ? error.message : 'An unknown error occurred'
        }`,
      );
    }
  }
}
