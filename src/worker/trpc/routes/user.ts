import { authProcedure, router } from "../trpc-instance";

export const userRouter = router({
  me: authProcedure.query(async ({ ctx }) => {
    const user = await ctx.userService.getUserById(ctx.userId!);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }),
});
