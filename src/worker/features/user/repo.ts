import { eq } from "drizzle-orm";
import { setupDb, users, type UsersTable } from "../../services/db";

type User = UsersTable["$inferSelect"];
type UserInsert = UsersTable["$inferInsert"];

type DB = D1Database;

export function createUserRepo({ db }: { db: DB }) {
  const drizzleDb = setupDb(db);

  return {
    async findUserById(userId: number): Promise<User | null> {
      const user = await drizzleDb
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return user[0] ?? null;
    },

    async findUserByTelegramId(telegramId: string): Promise<User | null> {
      const user = await drizzleDb
        .select()
        .from(users)
        .where(eq(users.telegramId, telegramId))
        .limit(1);

      return user[0] ?? null;
    },

    async createUser(userData: UserInsert): Promise<User> {
      const [newUser] = await drizzleDb
        .insert(users)
        .values(userData)
        .returning();
      return newUser;
    },

    async upsertUser(userData: UserInsert): Promise<User> {
      const [newUser] = await drizzleDb
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.telegramId,
          set: {
            // ommiting telegramId to avoid conflict
            name: userData.name,
            photoUrl: userData.photoUrl,
          },
        })
        .returning();

      return newUser;
    },
  };
}
