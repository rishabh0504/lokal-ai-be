import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'Message content',
    example: 'Hello, how are you?',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Agent ID (optional)',
    example: 'agent456',
    required: false,
  })
  @IsOptional()
  @IsString()
  agentId?: string;
}
