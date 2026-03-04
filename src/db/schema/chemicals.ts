import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { sql } from 'drizzle-orm';

export const chemicals = sqliteTable('chemicals', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  formula: text('formula').notNull(),
  colorHex: text('color_hex'),
  color: text('color'),
  state: text('state', { enum: ['liquid', 'solid', 'gas', 'aqueous'] }).notNull(),
  solubleInWater: integer('soluble_in_water', { mode: 'boolean' }).default(true),
  opacity: real('opacity').default(1),
  hasRefraction: integer('has_refraction', { mode: 'boolean' }).default(false),
  molarMass: real('molar_mass'),
  density: real('density'),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  createdById: text('created_by_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`),
});

export type Chemical = typeof chemicals.$inferSelect;
export type NewChemical = typeof chemicals.$inferInsert;