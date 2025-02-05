import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
} from 'class-validator';

export class AgentDto {
  @ApiProperty({ description: 'The name of the Agent' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The LLM Model ID', format: 'uuid' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  llmModelId: string;

  @ApiProperty({ description: 'Temperature for the agent', required: false })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiProperty({ description: 'Top_p for the agent', required: false })
  @IsNumber()
  @IsOptional()
  top_p?: number;

  @ApiProperty({ description: 'Top_k for the agent', required: false })
  @IsNumber()
  @IsOptional()
  top_k?: number;

  @ApiProperty({ description: 'Max tokens for the agent', required: false })
  @IsNumber()
  @IsOptional()
  max_tokens?: number;

  @ApiProperty({
    description: 'Presence penalty for the agent',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  presence_penalty?: number;

  @ApiProperty({
    description: 'Frequency penalty for the agent',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  frequency_penalty?: number;

  @ApiProperty({ description: 'Repeat penalty for the agent', required: false })
  @IsNumber()
  @IsOptional()
  repeat_penalty?: number;
}

export class AgentResponseDto extends AgentDto {
  @ApiProperty({ description: 'The unique identifier for the Agent' })
  id: string;
  @ApiProperty({ description: 'The date the Agent was created' })
  created_at: Date;
  @ApiProperty({ description: 'The date the Agent was updated' })
  updated_at: Date;
}
