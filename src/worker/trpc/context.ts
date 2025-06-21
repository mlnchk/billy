import { createBillService } from "../features/bill/service";
import { createVoteService } from "../features/vote/service";
import { createUserService } from "../features/user/service";
import { createAiService } from "../services/ai";
import { validate, parse } from "@telegram-apps/init-data-node";

export async function createContext(c: import("hono").Context<{ Bindings: Env }>) {
  const db = c.env.BILLY_DB;
  const aiService = createAiService(c.env.GOOGLEAI_API_KEY);

  const userService = createUserService({ db });
  const billService = createBillService({ db, aiService });
  const voteService = createVoteService({ db });

  let userId: number | null = null;
  const authHeader = c.req.header("Authorization");
  if (authHeader) {
    const [authType, authData = ""] = authHeader.split(" ");
    if (authType === "tma") {
      if (import.meta.env.PROD) {
        try {
          validate(authData, c.env.BOT_TOKEN);
        } catch {
          // ignore validation errors
        }
      }
      try {
        const parsed = parse(authData);
        const telegramUser = parsed.user;
        if (telegramUser) {
          const user = await userService.findOrCreateUserByTelegramId(
            telegramUser.id.toString(),
            {
              name: [telegramUser.first_name, telegramUser.last_name]
                .filter(Boolean)
                .join(" "),
              photoUrl: telegramUser.photo_url,
            },
          );
          userId = user.id;
        }
      } catch {
        // ignore parsing errors
      }
    }
  }

  return {
    req: c.req.raw,
    env: c.env,
    billService,
    voteService,
    userService,
    userId,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
