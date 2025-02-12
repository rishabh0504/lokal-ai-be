import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Title of the  session', required: false })
  title?: string;

  @IsString()
  @IsUUID()
  @ApiProperty({ description: 'Agent ID (UUID)', required: false })
  agentId: string;
}
