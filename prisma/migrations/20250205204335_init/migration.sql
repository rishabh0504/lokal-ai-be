-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "content" JSONB NOT NULL,
    "sender" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,

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

-- CreateIndex
CREATE UNIQUE INDEX "LLMModel_name_key" ON "LLMModel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LLMModel_modelName_key" ON "LLMModel"("modelName");

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_llmModelId_fkey" FOREIGN KEY ("llmModelId") REFERENCES "LLMModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
