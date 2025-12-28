import { Bot } from "grammy";
import type { AiService } from "../services/ai";
import type { DB } from "../domain/users";
import { formatBillAnalysis, formatCalculation } from "./formatter";
import { startCommand } from "./commands/start";
import * as bills from "../domain/bills";
import * as users from "../domain/users";
import * as voting from "../domain/voting";
import { InlineKeyboardMarkup } from "grammy/types";

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

// Unified approach for all chat types
const getTelegramAppUrl = (botUsername: string, billId: number) =>
  `https://t.me/${botUsername}/?startapp=bill_${billId}`;

// Function to create inline keyboard for opening the web app
const createWebAppInlineKeyboard = (
  botUsername: string,
  billId: number,
): InlineKeyboardMarkup => {
  const url = getTelegramAppUrl(botUsername, billId);

  return {
    inline_keyboard: [[{ text: "Open in App", url }]],
  };
};

export const createBot = async ({
  botToken,
  aiService,
  db,
}: {
  botToken: string;
  aiService: AiService;
  db: DB;
}) => {

  // Initialize bot with token from environment
  const bot = new Bot(botToken);

  // Get bot info to use in deep links
  const botInfo = await bot.api.getMe();
  const botUsername = botInfo.username;

  // Set bot commands
  await bot.api.setMyCommands(commands);

  bot.command("start", startCommand);
  bot.command("help", startCommand);

  // Debug command to open web app with bill ID 1
  bot.command("webapp", async (ctx) => {
    try {
      await ctx.reply(`Debug: Opening web app with bill ID 1`, {
        reply_markup: createWebAppInlineKeyboard(botUsername, 1),
      });
    } catch (error) {
      console.error("Error in webapp debug command:", error);
      await ctx.reply("Error in webapp debug command.");
    }
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
      const parsingMsg = await ctx.reply("Parsing the bill...");
      // Show typing status while processing
      await ctx.api.sendChatAction(ctx.chat.id, "typing");

      // deleting action message
      await ctx.api
        .deleteMessage(ctx.chat.id, ctx.message.message_id)
        .catch((error) => {
          // probably not enough rights to delete message
          console.error("Can't delete message:", error);
        });

      const { bill, items } = await bills.parseAndSaveBill(db, aiService, {
        chatId: ctx.chat.id,
        messageId: replyToMessage.message_id,
        imageUrl,
      });

      // Create formatted message
      const summaryMsgText = formatBillAnalysis({
        ...bill,
        billItems: items,
      });

      await ctx.reply(summaryMsgText, {
        parse_mode: "MarkdownV2",
        reply_parameters: { message_id: replyToMessage.message_id },
        reply_markup: createWebAppInlineKeyboard(botUsername, bill.id),
      });

      // deleting parsing message
      await ctx.api
        .deleteMessage(ctx.chat.id, parsingMsg.message_id)
        .catch((error) => {
          // probably not enough rights to delete message
          console.error("Can't delete message:", error);
        });

      // await ctx.api.pinChatMessage(ctx.chat.id, summaryMsg.message_id); // Bad Request: not enough rights to manage pinned messages in the chat
    } catch (error) {
      console.error("Error processing split command:", error);
      console.log(error);
      await ctx.reply(
        "Sorry, something went wrong while processing the bill.",
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
      const billId = await bills.getBillIdByTelegramMessage(
        db,
        ctx.chat.id,
        billMessageId,
      );
      if (!billId) {
        await ctx.reply(
          "No bill found. Please reply to the correct bill analysis message.",
        );
        return;
      }

      // Calculate bill split
      const calculationResult = await bills.getBillSplit(db, billId);
      if (!calculationResult) {
        await ctx.reply(
          "Sorry, something went wrong while calculating the split.",
        );
        return;
      }

      const calcMsg = formatCalculation(
        {
          unvotedItems: calculationResult.unvotedItems,
          userSelections: new Map(
            Object.entries(calculationResult.userSelections),
          ),
        },
        calculationResult.bill.currency,
      );

      await ctx.reply(calcMsg, {
        parse_mode: "MarkdownV2",
        reply_parameters: { message_id: billMessageId },
        reply_markup: createWebAppInlineKeyboard(botUsername, billId),
      });

      await ctx.deleteMessage().catch((error) => {
        // probably not enough rights to delete message
        console.error("Can't delete message:", error);
      });
    } catch (error) {
      console.error("Error processing calculate command:", error);
      await ctx.reply(
        "Sorry, something went wrong while calculating the split.",
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
      const billId = await bills.getBillIdByTelegramMessage(
        db,
        ctx.chat.id,
        billMessageId,
      );
      if (!billId) {
        await ctx.reply(
          "No bill found. Please reply to the correct bill analysis message.",
        );
        return;
      }

      // Parse vote message (comma-separated numbers)
      const votes = ctx.message.text.split(",").map((n) => parseInt(n.trim()));

      if (votes.length === 0) {
        await ctx.reply(
          "Please provide valid item numbers separated by commas (e.g. '1,3,4')",
        );
        return;
      }

      const user = await users.findOrCreateUser(db, ctx.from.id.toString(), {
        name: ctx.from.first_name,
      });

      await voting.voteForBill(db, {
        billId,
        votes: votes.map((itemId) => ({
          userId: user.id,
          itemId,
          quantity: 1, // TODO: quantity should be inferred from array item count
        })),
      });

      await ctx.api
        .deleteMessage(ctx.chat.id, ctx.message.message_id)
        .catch((error) => {
          // probably not enough rights to delete message
          console.error("Can't delete message:", error);
        });

      await ctx.reply(`${ctx.from.first_name}: ${votes.join(", ")}`, {
        reply_parameters: { message_id: billMessageId },
      });
    } catch (error) {
      console.error("Error processing vote:", error);
      await ctx.reply(
        "Sorry, something went wrong while processing your vote.",
      );
    }
  });

  return bot;
};
