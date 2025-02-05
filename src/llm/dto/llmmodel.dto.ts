import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsJSON,
} from 'class-validator';

export class LLMModelDto {
  @ApiProperty({ description: 'The name of the LLM Model' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The name of the LLM Model' })
  @IsString()
  @IsNotEmpty()
  modelName: string;

  @ApiProperty({ description: 'The version of the LLM Model', required: false })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({ description: 'Description of the LLM Model' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Minimum temperature', required: false })
  @IsNumber()
  @IsOptional()
  temperatureMin?: number;

  @ApiProperty({ description: 'Maximum temperature', required: false })
  @IsNumber()
  @IsOptional()
  temperatureMax?: number;

  @ApiProperty({ description: 'Default temperature', required: false })
  @IsNumber()
  @IsOptional()
  temperatureDefault?: number;

  @ApiProperty({ description: 'Minimum top_p', required: false })
  @IsNumber()
  @IsOptional()
  top_pMin?: number;

  @ApiProperty({ description: 'Maximum top_p', required: false })
  @IsNumber()
  @IsOptional()
  top_pMax?: number;

  @ApiProperty({ description: 'Default top_p', required: false })
  @IsNumber()
  @IsOptional()
  top_pDefault?: number;

  @ApiProperty({ description: 'Minimum top_k', required: false })
  @IsNumber()
  @IsOptional()
  top_kMin?: number;

  @ApiProperty({ description: 'Maximum top_k', required: false })
  @IsNumber()
  @IsOptional()
  top_kMax?: number;

  @ApiProperty({ description: 'Default top_k', required: false })
  @IsNumber()
  @IsOptional()
  top_kDefault?: number;

  @ApiProperty({ description: 'Minimum max_tokens', required: false })
  @IsNumber()
  @IsOptional()
  max_tokensMin?: number;

  @ApiProperty({ description: 'Maximum max_tokens', required: false })
  @IsNumber()
  @IsOptional()
  max_tokensMax?: number;

  @ApiProperty({ description: 'Default max_tokens', required: false })
  @IsNumber()
  @IsOptional()
  max_tokensDefault?: number;

  @ApiProperty({ description: 'Minimum presence_penalty', required: false })
  @IsNumber()
  @IsOptional()
  presence_penaltyMin?: number;

  @ApiProperty({ description: 'Maximum presence_penalty', required: false })
  @IsNumber()
  @IsOptional()
  presence_penaltyMax?: number;

  @ApiProperty({ description: 'Default presence_penalty', required: false })
  @IsNumber()
  @IsOptional()
  presence_penaltyDefault?: number;

  @ApiProperty({ description: 'Minimum frequency_penalty', required: false })
  @IsNumber()
  @IsOptional()
  frequency_penaltyMin?: number;

  @ApiProperty({ description: 'Maximum frequency_penalty', required: false })
  @IsNumber()
  @IsOptional()
  frequency_penaltyMax?: number;

  @ApiProperty({ description: 'Default frequency_penalty', required: false })
  @IsNumber()
  @IsOptional()
  frequency_penaltyDefault?: number;

  @ApiProperty({ description: 'Minimum repeat_penalty', required: false })
  @IsNumber()
  @IsOptional()
  repeat_penaltyMin?: number;

  @ApiProperty({ description: 'Maximum repeat_penalty', required: false })
  @IsNumber()
  @IsOptional()
  repeat_penaltyMax?: number;

  @ApiProperty({ description: 'Default repeat_penalty', required: false })
  @IsNumber()
  @IsOptional()
  repeat_penaltyDefault?: number;

  @ApiProperty({
    description: 'Stop sequences (JSON array of strings)',
    required: false,
  })
  @IsJSON()
  @IsOptional()
  stop_sequences?: string; // Store as a JSON string
}

export class LLMModelResponseDto extends LLMModelDto {
  @ApiProperty({ description: 'The unique identifier for the LLM Model' })
  id: string;
  @ApiProperty({ description: 'The date the LLM Model was created' })
  created_at: Date;
  @ApiProperty({ description: 'The date the LLM Model was updated' })
  updated_at: Date;
}
