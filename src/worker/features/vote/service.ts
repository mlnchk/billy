import { createVoteRepo } from "./repo";

export function createVoteService({ db }: { db: D1Database }) {
  const voteRepo = createVoteRepo({ db });

  return {
    // TODO: move logic from voteRepo here
    async getVotesByBillId(billId: number) {
      return voteRepo.getVotesByBillId(billId);
    },

    /**
     * Stores votes for a given bill.
     * Assumes users have already been resolved to their numeric IDs.
     * Deletes previous votes for the involved users on this bill before inserting new ones.
     */
    async voteForBill(params: {
      billId: number;
      votes: {
        itemId: number;
        userId: number;
        quantity: number;
      }[];
    }) {
      const userIds = [...new Set(params.votes.map((vote) => vote.userId))];

      await voteRepo.deleteVotesByBillId({
        billId: params.billId,
        userIds: userIds,
      });

      if (params.votes.length === 0) {
        return;
      }

      const votesToInsert = params.votes.map((vote) => ({
        billItemId: vote.itemId,
        userId: vote.userId,
        quantity: vote.quantity,
      }));

      return voteRepo.insertVotes({ votes: votesToInsert });
    },

    async updateVotesForBillItem(params: {
      billItemId: number;
      votes: {
        userId: number;
        quantity: number;
      }[];
    }) {
      const votesToInsert = params.votes.map((vote) => ({
        billItemId: params.billItemId,
        userId: vote.userId,
        quantity: vote.quantity,
      }));

      return voteRepo.insertVotes({ votes: votesToInsert });
    },
  };
}

export type VoteService = ReturnType<typeof createVoteService>;
