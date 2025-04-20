import { createBillRepo } from "../bill/repo";
import { createVoteRepo } from "./repo";

export function createVoteService({ db }: { db: D1Database }) {
  const billRepo = createBillRepo({ db });
  const voteRepo = createVoteRepo({ db });

  return {
    // TODO: move logic from voteRepo here
    async getVotesByBillId(billId: number) {
      return voteRepo.getVotesByBillId(billId);
    },

    // TODO: move logic from voteRepo here
    async storeVote(params: {
      billId: number;
      userId: string;
      votes: number[];
    }) {
      return voteRepo.storeVote(params);
    },
  };
}

export type VoteService = ReturnType<typeof createVoteService>;
