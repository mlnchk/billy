// import { createBillRepo } from "../bill/repo";
import { createVoteRepo } from "./repo";

export function createVoteService({ db }: { db: D1Database }) {
  // const billRepo = createBillRepo({ db });
  const voteRepo = createVoteRepo({ db });

  return {
    // TODO: move logic from voteRepo here
    async getVotesByBillId(billId: number) {
      return voteRepo.getVotesByBillId(billId);
    },

    // TODO: move logic from voteRepo here
    async storeVotes(params: {
      votes: {
        itemId: number;
        userId: number;
        quantity: number;
      }[];
    }) {
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
