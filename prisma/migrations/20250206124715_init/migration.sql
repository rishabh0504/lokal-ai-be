-- CreateEnum
CREATE TYPE "ToolType" AS ENUM ('API', 'PythonFunction', 'Search');

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "userId" TEXT NOT NULL,
    "agentId" TEXT,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "content" JSONB NOT NULL,
    "sender" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "sessionId" TEXT NOT NULL,
    "token_count" INTEGER,
    "cost" DOUBLE PRECISION,
    "latency" INTEGER,
    "agentId" TEXT,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LLMModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "version" TEXT,
    "description" TEXT NOT NULL,
    "temperatureMin" DOUBLE PRECISION DEFAULT 0.0,
    "temperatureMax" DOUBLE PRECISION DEFAULT 1.0,
    "temperatureDefault" DOUBLE PRECISION DEFAULT 0.7,
    "top_pMin" DOUBLE PRECISION DEFAULT 0.0,
    "top_pMax" DOUBLE PRECISION DEFAULT 1.0,
    "top_pDefault" DOUBLE PRECISION DEFAULT 0.9,
    "top_kMin" INTEGER DEFAULT 0,
    "top_kMax" INTEGER DEFAULT 100,
    "top_kDefault" INTEGER DEFAULT 0,
    "max_tokensMin" INTEGER DEFAULT 1,
    "max_tokensMax" INTEGER DEFAULT 4096,
    "max_tokensDefault" INTEGER DEFAULT 256,
    "presence_penaltyMin" DOUBLE PRECISION DEFAULT -2.0,
    "presence_penaltyMax" DOUBLE PRECISION DEFAULT 2.0,
    "presence_penaltyDefault" DOUBLE PRECISION DEFAULT 0.0,
    "frequency_penaltyMin" DOUBLE PRECISION DEFAULT -2.0,
    "frequency_penaltyMax" DOUBLE PRECISION DEFAULT 2.0,
    "frequency_penaltyDefault" DOUBLE PRECISION DEFAULT 0.0,
    "repeat_penaltyMin" DOUBLE PRECISION DEFAULT 1.0,
    "repeat_penaltyMax" DOUBLE PRECISION DEFAULT 2.0,
    "repeat_penaltyDefault" DOUBLE PRECISION DEFAULT 1.0,
    "stop_sequences" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LLMModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "llmModelId" TEXT NOT NULL,
    "prompt" TEXT,
    "temperature" DOUBLE PRECISION,
    "top_p" DOUBLE PRECISION,
    "top_k" INTEGER,
    "max_tokens" INTEGER,
    "presence_penalty" DOUBLE PRECISION,
    "frequency_penalty" DOUBLE PRECISION,
    "repeat_penalty" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ToolType" NOT NULL,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTool" (
    "agentId" TEXT NOT NULL,
    "toolConfigId" TEXT NOT NULL,

    CONSTRAINT "AgentTool_pkey" PRIMARY KEY ("agentId","toolConfigId")
);

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "LLMModel_name_key" ON "LLMModel"("name");

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_llmModelId_fkey" FOREIGN KEY ("llmModelId") REFERENCES "LLMModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTool" ADD CONSTRAINT "AgentTool_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTool" ADD CONSTRAINT "AgentTool_toolConfigId_fkey" FOREIGN KEY ("toolConfigId") REFERENCES "ToolConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
