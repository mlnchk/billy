import { createUserRepo } from "./repo";
import type { UsersTable } from "../../services/db";

type User = UsersTable["$inferSelect"];

export function createUserService({ db }: { db: D1Database }) {
  const userRepo = createUserRepo({ db });

  return {
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
      { name }: { name?: string } = {},
    ): Promise<User> {
      // Use telegramId as default name if creating a new user
      const defaultUsername = name ?? telegramId;

      const existingUser = await userRepo.findUserByTelegramId(telegramId);
      if (existingUser) {
        return existingUser;
      }

      // User not found, create a new one
      const newUser = await userRepo.createUser({
        telegramId: telegramId,
        name: defaultUsername,
      });
      return newUser;
    },
  };
}

export type UserService = ReturnType<typeof createUserService>;
