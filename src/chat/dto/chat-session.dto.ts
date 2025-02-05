import { ApiProperty } from '@nestjs/swagger';

export class ChatSessionDto {
  @ApiProperty({ description: 'The ID of the chat session' })
  id: string;

  @ApiProperty({ description: 'The creation timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'The update timestamp' })
  updated_at: Date;

  @ApiProperty({
    description: 'The ID of the user associated with the session',
  })
  userId: string;
}
