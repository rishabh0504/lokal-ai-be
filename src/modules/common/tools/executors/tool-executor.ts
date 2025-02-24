import { ToolConfig } from '@prisma/client';

export interface ToolExecutor {
  supports(executionType: string): boolean;
  execute(toolConfig: ToolConfig, input: any): Promise<any>;
}
