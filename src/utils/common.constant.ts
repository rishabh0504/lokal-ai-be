export const CORS_CONFIG = {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Accept, Authorization',
  credentials: true,
};

export const DEFAULT_TEMPLATE_FOR_LLM_CREATION = `
Your are a LLM expert. I need you help to create a llm config for the model {modelName} in the below format.
my expectation from you is to provide the LLM config in the below format.
resposne should be for the below structure for three types of the LLM config BASIC/Deterministic/CREATIVE type also please replace the placeholders with meaningful value
[
  {
    name: '{placeholder}',
    modelName: '{modelName}',
    version: 'latest',
    description:'{placeholder}',
    temperatureMin: {placeholder},
    temperatureMax: {placeholder},
    temperatureDefault:{placeholder},
    top_pMin:{placeholder},
    top_pMax:{placeholder},
    top_pDefault: {placeholder},
    top_kMin: {placeholder},
    top_kMax: {placeholder},
    top_kDefault: {placeholder},
    max_tokensMin: {placeholder},
    max_tokensMax: {placeholder},
    max_tokensDefault: {placeholder},
    presence_penaltyMin: {placeholder},
    presence_penaltyMax: {placeholder},
    presence_penaltyDefault:{placeholder},
    frequency_penaltyMin: {placeholder},
    frequency_penaltyMax: {placeholder},
    frequency_penaltyDefault: {placeholder},
    repeat_penaltyMin: {placeholder},
    repeat_penaltyMax: {placeholder},
    repeat_penaltyDefault: {placeholder},
    stop_sequences:{placeholder},
    usageCount: {placeholder},
    defaultPrompt:'{placeholder}',
  }
    ]
`;
