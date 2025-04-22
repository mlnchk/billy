// import { createBillRepo } from "../bill/repo";
import { createVoteRepo } from "./repo";
import { setupDb, users } from "../../services/db";

export function createVoteService({ db }: { db: D1Database }) {
  // const billRepo = createBillRepo({ db });
  const voteRepo = createVoteRepo({ db });

  const drizzleDb = setupDb(db);

  return {
    // TODO: move logic from voteRepo here
    async getVotesByBillId(billId: number) {
      return voteRepo.getVotesByBillId(billId);
    },

    // TODO: move logic from voteRepo here
    async storeVotes(params: {
      billId: number;
      votes: {
        itemId: number;
        userId: number;
        quantity: number;
      }[];
    }) {
      // FIXME: refactor working with users
      await drizzleDb
        .insert(users)
        .values(
          params.votes.map((vote) => ({
            name: vote.userId.toString(),
            id: vote.userId,
            telegramId: vote.userId.toString(),
          })),
        )
        .onConflictDoNothing();

      // remove old votes
      await voteRepo.deleteVotesByBillId({
        billId: params.billId,
        userIds: params.votes.map((vote) => vote.userId),
      });

      const votes = params.votes.map((vote) => ({
        billItemId: vote.itemId,
        userId: vote.userId,
        quantity: vote.quantity,
      }));

      return voteRepo.storeVotes({ votes });
    },
  };
}

export type VoteService = ReturnType<typeof createVoteService>;
