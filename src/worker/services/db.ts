import { relations, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import {
  integer,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

// Define the bills table
export const bills = sqliteTable("bills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subtotal: real("subtotal"),
  total: real("total").notNull(),
  currency: text("currency").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(current_timestamp)`),

  // telegram related fields
  telegramChatId: text("telegram_chat_id"),
  telegramMessageId: text("telegram_message_id"),
});

export type Bill = typeof bills.$inferSelect;

export type BillWithItems = Bill & {
  billItems: BillItem[];
};

export type BillInsert = typeof bills.$inferInsert;

const billsRelations = relations(bills, ({ many }) => ({
  billItems: many(billItems),
}));

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

export type BillItem = typeof billItems.$inferSelect;

export type BillItemInsert = typeof billItems.$inferInsert;

const billItemsRelations = relations(billItems, ({ one, many }) => ({
  bill: one(bills, {
    fields: [billItems.billId],
    references: [bills.id],
  }),
  itemAssignments: many(itemAssignments),
}));

// Define the item_assignments table to track which items are assigned to which users
export const itemAssignments = sqliteTable(
  "item_assignments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    billItemId: integer("bill_item_id")
      .notNull()
      .references(() => billItems.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    quantity: real("quantity").notNull(),
  },
  (t) => ({
    userId_billItemId: unique().on(t.userId, t.billItemId),
  }),
);

const itemAssignmentsRelations = relations(itemAssignments, ({ one }) => ({
  billItem: one(billItems, {
    fields: [itemAssignments.billItemId],
    references: [billItems.id],
  }),
  user: one(users, {
    fields: [itemAssignments.userId],
    references: [users.id],
  }),
}));

// Define the users table to track who's participating in bill splitting
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  telegramId: text("telegram_id").unique(),
});

const usersRelations = relations(users, ({ many }) => ({
  itemAssignments: many(itemAssignments),
}));

// Define relations for type safety
export type BillsTable = typeof bills;
export type BillItemsTable = typeof billItems;
export type ItemAssignmentsTable = typeof itemAssignments;
export type UsersTable = typeof users;

// Export the DB schema
export const schema = {
  bills,
  billItems,
  users,
  itemAssignments,

  billsRelations,
  billItemsRelations,
  itemAssignmentsRelations,
  usersRelations,
};

// DB setup function
export function setupDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
