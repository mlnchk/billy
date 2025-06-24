import { BotCommand } from "../types";

const HELP_MESSAGE = `
📝 How to start:

1. Send a photo of the receipt to the chat
2. Reply to the photo of the receipt and call \`/parse\` command
3. Open app by clicking the button
4. Vote for your items in app
`.trim();

export const startCommand: BotCommand = async (ctx) => {
  await ctx.reply(HELP_MESSAGE);
};
