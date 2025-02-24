import { Injectable, Logger } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import { ToolExecutor } from './tool-executor';
import { ToolConfig } from '@prisma/client';

@Injectable()
export class PythonToolExecutor implements ToolExecutor {
  private readonly logger = new Logger(PythonToolExecutor.name);

  constructor() {}

  supports(executionType: string): boolean {
    return executionType === 'PYTHON_FUNCTION';
  }

  private async executePython(code: string, input: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const pythonProcess: ChildProcess = spawn('python', ['-c', code]);
      let stdoutData = '';
      let stderrData = '';

      // Safely handle potentially missing stdin
      pythonProcess.stdin?.write(JSON.stringify(input));
      pythonProcess.stdin?.end();

      pythonProcess.stdout?.on('data', (data: Buffer) => {
        // Use optional chaining
        stdoutData += data.toString();
      });

      pythonProcess.stderr?.on('data', (data: Buffer) => {
        // Use optional chaining
        stderrData += data.toString();
      });

      pythonProcess.on('close', (exitCode: number) => {
        // code is a number
        if (exitCode !== 0) {
          this.logger.error(`Python script execution failed: ${stderrData}`);
          reject(new Error(`Python script execution failed: ${stderrData}`));
          return;
        }

        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const result: any = JSON.parse(stdoutData); // Specify the result type
          resolve(result);
        } catch (error) {
          this.logger.error(
            `Failed to parse JSON from Python script: ${String(error)}`, // Handle potential error object
          );
          reject(
            new Error(
              `Failed to parse JSON from Python script: ${String(error)}`,
            ),
          );
        }
      });
    });
  }

  async execute(toolConfig: ToolConfig, input: any): Promise<any> {
    try {
      const pythonCode: string | null = toolConfig.code; // Explicit type assertion
      if (!pythonCode) {
        throw new Error(`Python code is missing for tool: ${toolConfig.name}`);
      }
      return await this.executePython(pythonCode, input);
    } catch (error) {
      this.logger.error(`Error executing Python tool: ${String(error)}`);
      throw error;
    }
  }
}
