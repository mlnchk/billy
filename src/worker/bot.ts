import { Bot } from "grammy";
import { AiService } from "./services/ai.ts";
import { calculateBillSplit } from "./services/calculator.ts";
import { formatBillAnalysis, formatCalculation } from "./services/formatter.ts";
import { createBillRepo } from "./features/bill/repo.ts";
import { createVoteRepo } from "./features/vote/repo.ts";

// Set up bot commands
const commands = [
  { command: "parse", description: "Parse a bill (reply to a photo)" },
  {
    command: "calculate",
    description:
      "Calculate split and show who pays what (reply to bill analysis)",
  },
  { command: "help", description: "Show help information" },
];

const HELP_MESSAGE = `
📝 Как начать:
1. Скинь фото чека в чат
2. Ответь (reply) на фото чека. Вызови /parse
📶 Голосование:
3. Ответь (reply) на результат парсинга. Перечисли свои покупки: 1, 4, 7, 11.
🧮 Подсчет:
3. Ответь (reply) на результат парсинга. Вызови /calculate


И кое-что еще. Вот кусочек из чека:
-------------------------
05. LT Pineapple Batavia • 1 * ฿39.00
06. Nut Mix Unsalted • 3 * ฿400.00
07. Lotus Sweet Sao-wa Nae • 1 * ฿79.00
-------------------------
Под номером 6 у нас 3 пачки орехов. Допустим, 2 пачки из них твои.
Тогда ты проголосуешь за них вот так: 6,6
`.trim();

// TODO: move base url to env
const getWebAppUrl = (chatId: number, messageId: number) =>
  `https://billy-dev-bot.loca.lt/app/bill/${chatId}/${messageId}`;

export const createBot = async ({
  botToken,
  aiService,
  db,
}: {
  botToken: string;
  aiService: AiService;
  db: D1Database;
}) => {
  const billRepo = createBillRepo({ db });
  const voteRepo = createVoteRepo({ db });

  // Initialize bot with token from environment
  const bot = new Bot(botToken);

  // Set bot commands
  await bot.api.setMyCommands(commands);

  // Command handlers
  bot.command("start", async (ctx) => {
    console.log("start", ctx.chat);
    await ctx.reply(HELP_MESSAGE);
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(HELP_MESSAGE);
  });

  bot.command("webapp", async (ctx) => {
    const chatId = ctx.chat.id;
    // const messageId = 335;
    if (!ctx.message?.reply_to_message) {
      return ctx.reply("Please reply to a message with /webapp");
    }

    const replyToMessage = ctx.message.reply_to_message;
    const messageId = replyToMessage.message_id;

    return ctx.reply(
      "Here is the webapp\n\n" + getWebAppUrl(chatId, messageId),
      {
        parse_mode: "Markdown",
        // reply_parameters: { message_id: messageId },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Open Bill in Web App",
                web_app: {
                  url: getWebAppUrl(chatId, messageId),
                },
              },
            ],
          ],
        },
      },
    );
  });

  // Handle photo messages with /parse command
  bot.command("parse", async (ctx) => {
    try {
      if (!ctx.message) {
        await ctx.reply("Please reply to a photo with /parse");
        return;
      }

      // Check if command is a reply to a photo
      const replyToMessage = ctx.message.reply_to_message;
      if (!replyToMessage?.photo) {
        await ctx.reply("Please reply to a photo with /parse");
        return;
      }

      // Get the largest photo version
      const photo = replyToMessage.photo.toSorted(
        (a, b) => b.width - a.width,
      )[0];
      const file = await ctx.api.getFile(photo.file_id);
      const imageUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

      // Send processing message
      const parsingMsg = await ctx.reply("🔍 Parsing the bill...");
      // Show typing status while processing
      await ctx.api.sendChatAction(ctx.chat.id, "typing");

      // deleting action message
      await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);

      // Analyze bill
      const bill = await aiService.analyzeBillImage(imageUrl); // TODO: это может быть долго и функция отомрет, надо делать очередь
      // Store bill using storage service
      await billRepo.saveBill(ctx.chat.id, replyToMessage.message_id, bill);

      // Create formatted message
      const summaryMsgText = formatBillAnalysis(bill);

      await ctx.reply(summaryMsgText, {
        parse_mode: "MarkdownV2",
        reply_parameters: { message_id: replyToMessage.message_id },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Open Bill in Web App",
                web_app: {
                  url: getWebAppUrl(ctx.chat.id, replyToMessage.message_id),
                },
              },
            ],
          ],
        },
      });

      // deleting parsing message
      await ctx.api.deleteMessage(ctx.chat.id, parsingMsg.message_id);

      // await ctx.api.pinChatMessage(ctx.chat.id, summaryMsg.message_id); // Bad Request: not enough rights to manage pinned messages in the chat
    } catch (error) {
      console.error("Error processing split command:", error);
      await ctx.reply(
        "❌ Sorry, something went wrong while processing the bill.",
      );
    }
  });

  // Handle calculate command
  bot.command("calculate", async (ctx) => {
    try {
      const billMessageId =
        // message_thread_id works only in group chats
        ctx.message?.message_thread_id ??
        ctx.message?.reply_to_message?.message_id;

      if (!billMessageId) {
        await ctx.reply(
          "Please use this command as a reply to the bill analysis message",
        );
        return;
      }

      // Get bill using storage service
      const bill = await billRepo.getBill(ctx.chat.id, billMessageId);
      if (!bill) {
        await ctx.reply(
          "This message is not a bill analysis. Please reply to the correct message.",
        );
        return;
      }

      // Get all votes using storage service
      const votes = await voteRepo.getVotes(ctx.chat.id, billMessageId);

      // Get user names for votes
      const votesWithNames = new Map<string, number[]>();
      for (const [userId, userVotes] of votes) {
        const userInfo = await ctx.api.getChatMember(
          ctx.chat!.id,
          parseInt(userId),
        );
        votesWithNames.set(userInfo.user.first_name, userVotes);
      }

      // Calculate bill split
      const calculationResult = calculateBillSplit(bill, votesWithNames);

      // Format the result
      const calcMsg = formatCalculation(calculationResult, bill.currency);

      // for some reason chat_id is `-1002490229132` when in reality it is `2490229132` (-100 in the beginning)
      // link ref: https://t.me/c/2490229132/168?thread=168
      // const linkToThread = `https://t.me/c/${ctx.message?.chat.id}/${ctx.message?.message_thread_id}?thread=${ctx.message?.message_thread_id}`;

      await ctx.reply(calcMsg, {
        parse_mode: "MarkdownV2",
        reply_parameters: { message_id: billMessageId },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Open Bill in Web App",
                web_app: {
                  url: getWebAppUrl(ctx.chat.id, billMessageId),
                },
              },
            ],
          ],
        },
        // reply_markup: {
        // force_reply: true,
        //   inline_keyboard: [[{ text: "Open thread", url: linkToThread }]],
        // },
      });

      await ctx.deleteMessage();
    } catch (error) {
      console.error("Error processing calculate command:", error);
      await ctx.reply(
        "❌ Sorry, something went wrong while calculating the split.",
      );
    }
  });

  // Handle vote messages (replies to bill analysis)
  bot.on("message:text", async (ctx) => {
    // we can use ctx.message.message_thread_id to refer to original bill message, but only inside group chats
    try {
      const billMessageId =
        // message_thread_id works only in group chats
        ctx.message?.message_thread_id ??
        ctx.message?.reply_to_message?.message_id;

      if (!billMessageId || !ctx.from) return;

      // Get bill using storage service
      const bill = await billRepo.getBill(ctx.chat.id, billMessageId);
      if (!bill) return;

      // Parse vote message (comma-separated numbers)
      const votes = ctx.message.text
        .split(",")
        .map((n) => parseInt(n.trim()))
        .filter((n) => !isNaN(n) && n > 0 && n <= bill.items.length);

      if (votes.length === 0) {
        await ctx.reply(
          "Please provide valid item numbers separated by commas (e.g. '1,3,4')",
        );
        return;
      }

      // Store vote using storage service
      await voteRepo.storeVote(
        ctx.chat.id,
        billMessageId,
        ctx.from.id.toString(),
        votes,
      );

      await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);

      await ctx.reply(`☑️ ${ctx.from.first_name}: ${votes.join(", ")}`, {
        reply_parameters: { message_id: billMessageId },
      });
    } catch (error) {
      console.error("Error processing vote:", error);
      await ctx.reply(
        "❌ Sorry, something went wrong while processing your vote.",
      );
    }
  });

  return bot;
};
