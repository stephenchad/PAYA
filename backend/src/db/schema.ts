// src/db/schema.ts
import { pgTable, text, integer, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  balance: integer('balance').notNull().default(0), // in kobo
  currency: text('currency').notNull().default('NGN'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Define the relationship
export const usersRelations = relations(users, ({ one }) => ({
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));


// Add this to the bottom of schema.ts

export const transactionTypeEnum = pgEnum('transaction_type', [
  'fund',
  'send',
  'receive',
]);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'success',
  'failed',
]);

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: transactionTypeEnum('type').notNull(),
  status: transactionStatusEnum('status').notNull().default('success'),
  amount: integer('amount').notNull(),          // in kobo, always positive
  balanceAfter: integer('balance_after').notNull(),
  counterpartyId: uuid('counterparty_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  counterpartyName: text('counterparty_name'),
  reference: text('reference').notNull().unique(),
  note: text('note'),
  metadata: text('metadata'),                   // JSON string for extra info
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

import { pgTable, text, integer, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';