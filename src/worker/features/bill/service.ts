import { createVoteRepo } from "../vote/repo";
import { createBillRepo } from "./repo";
import { AiService } from "../../services/ai";

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

    async getBillWithVotes(params: { chatId: number; messageId: number }) {
      const bill = await billRepo.getBill(params.chatId, params.messageId);

      if (!bill) {
        return null;
      }

      const votes = await voteRepo.getVotesByBillId(bill.id);

      return { bill, votes };
    },
  };
}
