import { createUserRepo } from "./repo";
import type { UsersTable } from "../../services/db";

type User = UsersTable["$inferSelect"];

export function createUserService({ db }: { db: D1Database }) {
  const userRepo = createUserRepo({ db });

  return {
    async getUserById(userId: number): Promise<User | null> {
      return userRepo.findUserById(userId);
    },

    /**
     * Finds a user by Telegram ID.
     */
    async getUserByTelegramId(telegramId: string): Promise<User | null> {
      return userRepo.findUserByTelegramId(telegramId);
    },

    /**
     * Finds a user by Telegram ID, creating one if it doesn't exist.
     * Uses the Telegram ID as the default name if creating.
     */
    async findOrCreateUserByTelegramId(
      telegramId: string,
      { name, photoUrl }: { name?: string; photoUrl?: string } = {},
    ): Promise<User> {
      const newUser = await userRepo.upsertUser({
        telegramId: telegramId,
        name: name ?? telegramId,
        photoUrl: photoUrl,
      });

      return newUser;
    },
  };
}

export type UserService = ReturnType<typeof createUserService>;
