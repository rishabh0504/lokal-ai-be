export interface ToolExecutor {
  supports(executionType: string): boolean;
  execute(toolConfig: any, input: any): Promise<any>;
}
