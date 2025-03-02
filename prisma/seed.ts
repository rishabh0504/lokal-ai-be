import { LLMModel, PrismaClient } from '@prisma/client';
import { InputJsonValue } from '@prisma/client/runtime/library';

type LLMModelOmitType = Omit<LLMModel, 'id' | 'created_at' | 'updated_at'>;

const PRE_CONFIGURED_LLM_MODEL: LLMModelOmitType[] = [];
const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  for (const modelData of PRE_CONFIGURED_LLM_MODEL) {
    try {
      await prisma.lLMModel.upsert({
        where: { name: modelData.name },
        update: {
          ...modelData,
          stop_sequences: modelData.stop_sequences
            ? (modelData.stop_sequences as InputJsonValue)
            : undefined,
        },
        create: {
          ...modelData,
          stop_sequences: modelData.stop_sequences
            ? (modelData.stop_sequences as InputJsonValue)
            : undefined,
        },
      });
      console.log(`Created/Updated LLMModel: ${modelData.name}`);
    } catch (error) {
      console.error(`Error seeding LLMModel ${modelData.name}:`, error);
    }
  }

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
