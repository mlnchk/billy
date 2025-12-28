import { eq } from "drizzle-orm";
import { setupDb, users, type UsersTable } from "../services/db";

type User = UsersTable["$inferSelect"];

export type DB = ReturnType<typeof setupDb>;

export async function findUserById(db: DB, userId: number): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result[0] ?? null;
}

export async function findUserByTelegramId(db: DB, telegramId: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);
  return result[0] ?? null;
}

export async function findOrCreateUser(
  db: DB,
  telegramId: string,
  { name, photoUrl }: { name?: string; photoUrl?: string } = {},
): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({
      telegramId,
      name: name ?? telegramId,
      photoUrl,
    })
    .onConflictDoUpdate({
      target: users.telegramId,
      set: {
        name: name ?? telegramId,
        photoUrl,
      },
    })
    .returning();

  return user;
}
