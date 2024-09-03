import { Controller, Get, Query } from '@nestjs/common';
import { ConversationsService } from 'src/services/conversations/conversations.service';

@Controller('/api/v1/conversations')
export class ConversationsController {
  constructor(private conversationService: ConversationsService) {}

  @Get('/list')
  getConversationList(@Query('userId') id: string) {
    return this.conversationService.getUserConversations(id);
  }
}
