import { router } from "./trpc-instance";
import { userRouter } from "./routes/user";
import { billRouter } from "./routes/bill";

export const appRouter = router({
  user: userRouter,
  bill: billRouter,
});

export type AppRouter = typeof appRouter;
