export interface ModelDetails {
  parent_model: string;
  format: string;
  family: string;
  families: string[];
  parameter_size: string;
  quantization_level: string;
}
export interface OllamaLLMModel {
  name: string;
  model: string;
  modified_at: Date;
  size: number;
  digest: string;
  details: ModelDetails;
}
