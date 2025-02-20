import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum ExecutionTypeDto {
  REST_API = 'REST_API',
  PYTHON_FUNCTION = 'PYTHON_FUNCTION',
  JAVASCRIPT_FUNCTION = 'JAVASCRIPT_FUNCTION',
  CUSTOM = 'CUSTOM',
}

export enum AuthTypeDto {
  NONE = 'NONE',
  API_KEY = 'API_KEY',
  OAUTH2 = 'OAUTH2',
  CUSTOM = 'CUSTOM',
}

export class ToolConfigDto {
  @ApiProperty({ description: 'The name of the Tool' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of the Tool' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'JSON Schema for input parameters' })
  @IsJSON()
  @IsNotEmpty()
  input_schema: string;

  @ApiProperty({ description: 'JSON Schema for output parameters' })
  @IsJSON()
  @IsNotEmpty()
  output_schema: string;

  @ApiProperty({
    description: 'How the tool is executed',
    enum: ExecutionTypeDto,
  })
  @IsEnum(ExecutionTypeDto)
  execution_type: ExecutionTypeDto;

  @ApiProperty({
    description: 'Details for execution (API URL, function name, etc.)',
  })
  @IsJSON()
  @IsNotEmpty()
  execution_details: string;

  @ApiProperty({
    description: 'Source code for the tool (if applicable)',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ description: 'Authentication method', enum: AuthTypeDto })
  @IsEnum(AuthTypeDto)
  auth_type: AuthTypeDto;

  @ApiProperty({
    description: 'Authentication details (API key, OAuth config, etc.)',
    required: false,
  })
  @IsJSON()
  @IsOptional()
  auth_details?: string;

  @ApiProperty({
    description: 'Is it safe to execute without confirmation?',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_safe?: boolean;

  @ApiProperty({
    description: 'Requires user confirmation before execution?',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  requires_confirmation?: boolean;

  @ApiProperty({ description: 'ID of the user who created the tool' })
  @IsString()
  @IsOptional()
  userId?: string;
}

export class ToolConfigResponseDto extends ToolConfigDto {
  @ApiProperty({ description: 'The unique identifier for the Tool' })
  id: string;

  @ApiProperty({ description: 'The date the Tool was created' })
  createdAt: Date;

  @ApiProperty({ description: 'The date the Tool was updated' })
  updatedAt: Date;
}
