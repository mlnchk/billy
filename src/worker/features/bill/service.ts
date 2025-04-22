import { createVoteRepo } from "../vote/repo";
import { createBillRepo } from "./repo";
import { AiService } from "../../services/ai";
import { calculateBillSplit } from "../../services/calculator";

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

    async getBillSplit(billId: number) {
      // FIXME: i don't like `this` here
      const billWithVotes = await this.getBillWithVotes({
        billId,
      });

      if (!billWithVotes) {
        return null;
      }

      return calculateBillSplit(
        billWithVotes.bill,
        billWithVotes.votes.map((vote) => ({
          userId: vote.userId,
          itemId: vote.billItemId,
          quantity: vote.quantity,
        })),
      );
    },
  };
}
