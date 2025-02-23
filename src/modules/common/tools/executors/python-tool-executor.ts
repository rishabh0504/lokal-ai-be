import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { ToolExecutor } from './tool-executor';

@Injectable()
export class PythonToolExecutor implements ToolExecutor {
  private readonly logger = new Logger(PythonToolExecutor.name);

  constructor() {}

  supports(executionType: string): boolean {
    return executionType === 'PYTHON_FUNCTION';
  }

  private async executePython(code: string, input: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', ['-c', code]);
      let stdoutData = '';
      let stderrData = '';

      pythonProcess.stdin.write(JSON.stringify(input));
      pythonProcess.stdin.end();

      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          this.logger.error(`Python script execution failed: ${stderrData}`);
          reject(new Error(`Python script execution failed: ${stderrData}`));
          return;
        }

        try {
          const result = JSON.parse(stdoutData);
          resolve(result);
        } catch (error) {
          this.logger.error(
            `Failed to parse JSON from Python script: ${error}`,
          );
          reject(
            new Error(`Failed to parse JSON from Python script: ${error}`),
          );
        }
      });
    });
  }

  async execute(toolConfig: any, input: any): Promise<any> {
    try {
      const pythonCode = toolConfig.code;
      if (!pythonCode) {
        throw new Error(`Python code is missing for tool: ${toolConfig.name}`);
      }
      return await this.executePython(pythonCode, input);
    } catch (error) {
      this.logger.error(`Error executing Python tool: ${error}`);
      throw error;
    }
  }
}
