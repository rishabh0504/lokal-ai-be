import { Global, Module } from '@nestjs/common';
import { JavascriptExecutor } from './tools/executors/js-executor';
import { PythonToolExecutor } from './tools/executors/python-tool-executor';

export const TOOL_EXECUTORS = 'TOOL_EXECUTORS';

@Global()
@Module({
  providers: [
    PythonToolExecutor,
    JavascriptExecutor,
    {
      provide: TOOL_EXECUTORS,
      useFactory: (
        pythonExecutor: PythonToolExecutor,
        javascriptExecutor: JavascriptExecutor,
      ) => [pythonExecutor, javascriptExecutor],
      inject: [PythonToolExecutor, JavascriptExecutor],
    },
  ],
  exports: [TOOL_EXECUTORS],
})
export class LokalAICommonModule {}
