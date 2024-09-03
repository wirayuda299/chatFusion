interface ReactionGroup {
  [emoji: string]: {
    emoji: string;
    unified_emoji: string;
    count: number;
  };
}

export function groupReactionsByEmoji(messageList: any[]) {
  return messageList.map((message) => {
    const groupedReactions = (message.reactions || []).reduce(
      (
        acc: ReactionGroup,
        reaction: { emoji: string; unified_emoji: string }
      ) => {
        const emojiKey = reaction.emoji;
        if (!acc[emojiKey]) {
          acc[emojiKey] = {
            emoji: reaction.emoji,
            unified_emoji: reaction.unified_emoji,
            count: 0,
          };
        }
        acc[emojiKey].count += 1;
        return acc;
      },
      {}
    );

    return {
      ...message,
      reactions: Object.values(groupedReactions),
    };
  });
}
