import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({ description: 'The ID of the chat message' })
  id: string;

  @ApiProperty({ description: 'The creation timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'The update timestamp' })
  updated_at: Date;

  @ApiProperty({ description: 'The JSON content of the message' })
  content: any;

  @ApiProperty({ description: 'The sender of the message' })
  sender: string;

  @ApiProperty({
    description: 'The ID of the chat session this message belongs to',
  })
  sessionId: string;
}
