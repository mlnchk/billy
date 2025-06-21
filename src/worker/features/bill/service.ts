import { createVoteRepo } from "../vote/repo";
import { createBillRepo } from "./repo";
import { AiService } from "../../services/ai";
import { calculateBillSplit } from "../../services/calculator";
import type { Bill, BillItem } from "../../services/db"; // Import Bill and BillItem types

// Define the structure expected by the API route
interface BillItemDetailsResponse {
  billItem: BillItem;
  bill: Bill;
  userVotes: {
    userId: number;
    share: number;
    user: {
      id: number;
      name: string | null;
      photoUrl: string | null;
    };
  }[];
}

export function createBillService({
  db,
  aiService,
}: {
  db: D1Database;
  aiService: AiService;
}) {
  const billRepo = createBillRepo({ db });
  /**
   * Не уверен, что использовать voteRepo в чужом сервисе это хорошая идея.
   *
   * С другой стороны, если использовать чужие сущности из "более низких" слоев,
   * то это выглядит ок. То есть использовать `voteRepo` внутри `billRepo` не стоит,
   * но использовать `voteRepo` в чужом сервисе это ок.
   */
  const voteRepo = createVoteRepo({ db });

  return {
    async getBillIdByTelegramChatIdAndMessageId(
      chatId: number,
      messageId: number,
    ) {
      return billRepo.getBillIdByTelegramChatIdAndMessageId(chatId, messageId);
    },

    async parseAndSaveBill(params: {
      chatId: number;
      messageId: number;
      imageUrl: string;
    }) {
      const bill = await aiService.analyzeBillImage(params.imageUrl); // TODO: это может быть долго и функция отомрет, надо делать очередь

      return billRepo.saveBill(
        params.chatId,
        params.messageId,
        bill,
        bill.items,
      );
    },

    async getBillWithVotes(params: { billId: number }) {
      const bill = await billRepo.getBillWithItems(params.billId);

      if (!bill) {
        return null;
      }

      const votes = await voteRepo.getVotesByBillId(bill.id);

      return { bill, votes };
    },

    async getBillItem(itemId: number) {
      return billRepo.getBillItem(itemId);
    },

    async getBillItemWithVotes(params: {
      itemId: number;
    }): Promise<BillItemDetailsResponse | null> {
      const billItem = await billRepo.getBillItem(params.itemId);
      if (!billItem) {
        return null;
      }

      const bill = billItem.bill;
      if (!bill) {
        return null;
      }

      const userVotesForItem = await voteRepo.getVotesByBillItemId(
        params.itemId,
      );

      return {
        billItem,
        bill,
        userVotes: userVotesForItem.map(({ userId, quantity, user }) => ({
          userId,
          share: quantity,
          user,
        })),
      };
    },

    async getBillSplit(billId: number) {
      // FIXME: i don't like `this` here
      const billWithVotes = await this.getBillWithVotes({
        billId,
      });

      if (!billWithVotes) {
        return null;
      }

      const calculationResult = calculateBillSplit(
        billWithVotes.bill,
        billWithVotes.votes.map((vote) => ({
          userId: vote.user.id,
          itemId: vote.billItemId,
          quantity: vote.quantity,
        })),
      );

      // Create a map of user IDs to user information
      const userMap = new Map();
      billWithVotes.votes.forEach((vote) => {
        userMap.set(vote.user.id, vote.user);
      });

      // Include user information in userSelections
      const enhancedUserSelections = Object.fromEntries(
        Array.from(calculationResult.userSelections.entries()).map(
          ([userId, selection]) => [
            userId,
            {
              ...selection,
              user: userMap.get(userId),
            },
          ],
        ),
      );

      return {
        ...calculationResult,
        userSelections: enhancedUserSelections,
        bill: billWithVotes.bill,
      };
    },
  };
}
