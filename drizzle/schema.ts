import { int, mysqlTable, text } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const users = mysqlTable('users', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  name: text('name'),
});

export const accounts = mysqlTable('accounts', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  userId: int('user_id', { unsigned: true }),
  name: text('name'),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));
