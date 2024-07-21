import { int, mysqlTable, text } from 'drizzle-orm/mysql-core';

export const test = mysqlTable('test', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  name: text('name'),
});
