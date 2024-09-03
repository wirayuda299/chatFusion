import { Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';

import { ReactionsService } from 'src/services/reactions/reactions.service';

@Controller('api/v1/reactions')
export class ReactionsController {
  constructor(private reactionService: ReactionsService) {}

  @Post('/add-or-remove')
  addOrRemoveReaction(@Req() req: Request) {
    const { message_id, emoji, unified_emoji, react_by } = req.body;

    return this.reactionService.addOrRemoveReactions(
      message_id,
      emoji,
      unified_emoji,
      react_by
    );
  }
}
