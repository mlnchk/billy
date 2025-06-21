import { z } from "zod";
import { authProcedure, router } from "../trpc-instance";

export const billRouter = router({
  get: authProcedure
    .input(z.object({ billId: z.number() }))
    .query(async ({ ctx, input }) => {
      const bill = await ctx.billService.getBillWithVotes({ billId: input.billId });
      if (!bill) {
        throw new Error("Bill not found");
      }
      return bill;
    }),

  results: authProcedure
    .input(z.object({ billId: z.number() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.billService.getBillSplit(input.billId);
      if (!res) {
        throw new Error("Bill not found or could not be calculated");
      }
      return res;
    }),

  getItem: authProcedure
    .input(z.object({ itemId: z.number() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.billService.getBillItemWithVotes({ itemId: input.itemId });
      if (!item) {
        throw new Error("Bill item details not found");
      }
      return item;
    }),

  editItem: authProcedure
    .input(
      z.object({
        itemId: z.number(),
        votes: z.array(
          z.object({ userId: z.number(), share: z.number() })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.voteService.updateVotesForBillItem({
        billItemId: input.itemId,
        votes: input.votes.map((v) => ({
          userId: v.userId,
          quantity: v.share,
        })),
      });
      return { ok: true } as const;
    }),

  vote: authProcedure
    .input(z.object({ billId: z.number(), itemIds: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.voteService.voteForBill({
        billId: input.billId,
        votes: input.itemIds.map((id) => ({
          userId: ctx.userId!,
          itemId: id,
          quantity: 1,
        })),
      });
      return { ok: true } as const;
    }),
});
