import { Injectable, Logger } from '@nestjs/common';
import { ToolExecutor } from './tool-executor';
import { ToolConfig } from '@prisma/client';

@Injectable()
export class JavascriptExecutor implements ToolExecutor {
  private readonly logger = new Logger(JavascriptExecutor.name);

  constructor() {}

  supports(executionType: string): boolean {
    return executionType === 'JAVASCRIPT_FUNCTION';
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async executeJavascript(code: string, input: any): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      // Replace with secure JavaScript execution (e.g., vm2)
      // This is a placeholder - never execute arbitrary JS with eval()
      // try {
      //   const result = eval(code); // Insecure! Replace with vm2
      //   resolve(result);
      // } catch (error) {
      //   this.logger.error(`Error executing Javascript tool: ${error}`);
      //   throw error;
      // }
    });
  }

  async execute(toolConfig: ToolConfig, input: any): Promise<any> {
    try {
      const javascriptCode = toolConfig.code;
      if (!javascriptCode) {
        throw new Error(`Python code is missing for tool: ${toolConfig.name}`);
      }
      return await this.executeJavascript(javascriptCode, input);
    } catch (error) {
      this.logger.error(`Error executing Python tool: ${error}`);
      throw error;
    }
  }
}
