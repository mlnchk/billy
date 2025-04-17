import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Define the bills table
export const bills = sqliteTable("bills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subtotal: real("subtotal"),
  total: real("total").notNull(),
  currency: text("currency").notNull(),
  telegramChatId: text("telegram_chat_id"),
  telegramMessageId: text("telegram_message_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Define the bill items table
export const billItems = sqliteTable("bill_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  billId: integer("bill_id")
    .notNull()
    .references(() => bills.id, { onDelete: "cascade" }),
  nameOriginal: text("name_original").notNull(),
  nameEnglish: text("name_english").notNull(),
  quantity: integer("quantity").notNull().default(1),
  pricePerUnit: real("price_per_unit"),
  priceTotal: real("price_total"),
});

// Define the users table to track who's participating in bill splitting
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  telegramId: text("telegram_id"),
});
// Define the item_assignments table to track which items are assigned to which users
export const itemAssignments = sqliteTable("item_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  billItemId: integer("bill_item_id")
    .notNull()
    .references(() => billItems.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  quantity: real("quantity").notNull(),
});

// DB setup function
export function setupDb(d1: D1Database) {
  return drizzle(d1);
}

// Define relations for type safety
export type BillsTable = typeof bills;
export type BillItemsTable = typeof billItems;
export type UsersTable = typeof users;
export type ItemAssignmentsTable = typeof itemAssignments;

// Export the DB schema
export const schema = {
  bills,
  billItems,
  users,
  itemAssignments,
};
