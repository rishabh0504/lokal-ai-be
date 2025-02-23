import { Ollama } from '@langchain/ollama';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage } from '@prisma/client';
import { encode } from 'gpt-tokenizer';
import { Subject } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { TOOL_EXECUTORS } from '../common/common.module';
import { ToolExecutor } from '../common/tools/executors/tool-executor';
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
    @Inject(TOOL_EXECUTORS) private readonly toolExecutors: ToolExecutor[],
  ) {
    try {
      const ollamaHost = this.configService.get<string>('OLLAMA_HOST');
      if (ollamaHost) {
        this.ollamaBaseUrl = ollamaHost;
      } else {
        throw new Error('OLLAMA_HOST is missing');
      }
    } catch (error) {}
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
      return 0;
    }
  }

  private getToolExecutor(toolConfig: any): ToolExecutor {
    const executor = this.toolExecutors.find((e) =>
      e.supports(toolConfig.execution_type),
    );

    if (!executor) {
      throw new Error(
        `No ToolExecutor found for execution type: ${toolConfig.execution_type}`,
      );
    }
    return executor;
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
        include: {
          agent: {
            include: {
              llmModel: true,
              AgentTool: {
                include: {
                  toolConfig: true,
                },
              },
            },
          },
        },
      });

      if (!chatSession) {
        this.logger.error(`Chat session not found for id: ${sessionId}`);
        throw new Error('Chat session not found');
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
          `No LLM model associated with the agent.`,
        );
        throw new Error(
          `No LLM model associated with agent ID ${agent.id}: No LLM model found`,
        );
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
          `Error creating user message in DB: ${dbError?.message}`,
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
      const prompt = `${agent.prompt}\nHistory: ${formattedHistory}\nUser: ${messageContent}\nAssistant:`;

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

        agentMessageStream.next({ content: '', sender: 'agent', done: true });
      } catch (ollamaError: any) {
        this.logger.error(
          `Ollama stream error: ${ollamaError?.message}`,
          ollamaError?.stack,
        );
        const agentMessageStream = this.getAgentChatMessageStream(sessionId);
        agentMessageStream.error(ollamaError);
        throw ollamaError;
      }

      // Tool execution logic
      let match;
      const toolRegex = /(\w+):\s*(\{.*\})/;
      while ((match = fullResponse.match(toolRegex))) {
        const toolName = match[1];
        const toolArgsString = match[2];
        fullResponse = fullResponse.replace(match[0], '').trim();

        const agentTool = agent.AgentTool.find(
          (at) => at.toolConfig.name.toLowerCase() === toolName.toLowerCase(),
        );

        if (agentTool) {
          const toolConfig = agentTool.toolConfig;

          try {
            let toolArgs = {};
            if (toolArgsString) {
              toolArgs = JSON.parse(toolArgsString);
            }

            const toolExecutor = this.getToolExecutor(toolConfig);
            const result = await toolExecutor.execute(toolConfig, toolArgs);
            fullResponse += `\n${toolName}_result: ${JSON.stringify(result)}`;
          } catch (error) {
            this.logger.error(`Error executing tool ${toolName}: ${error}`);
            fullResponse += `\nError executing tool ${toolName}: ${error}`;
          }
        } else {
          this.logger.warn(`Tool ${toolName} not found for this agent.`);
          fullResponse += `\nTool ${toolName} not found.`;
        }
      }

      const agentTokenCount = this.getTokenCount(fullResponse);

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
          `Error creating agent message in DB: ${dbError.message}`,
          dbError.stack,
        );
      }
    } catch (error: any) {
      this.logger.error(`Error in sendMessage: ${error.message}`, error.stack);
      throw error;
    }
  }

  async fetchChatHistory(sessionId: string): Promise<any[]> {
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
          `No LLM model associated with the agent.`,
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
          token_count: chatSession?.token_count,
        },
      });

      return chatHistoryList;
    } catch (error: any) {
      this.logger.error(
        `Error fetching chat history for session ID ${sessionId}: ${error.message}`,
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
