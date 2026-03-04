import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { sql } from 'drizzle-orm';

export const favorite_chemicals = sqliteTable('favorite_chemicals', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  
  // Polymorphic association - can favorite either a chemical or a reaction
  favoriteId: text('favorite_id').notNull(), // References either chemicals.id or reactions.id
  
  // Optional note
  note: text('note'),
  
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`),
});

// Composite unique constraint to prevent duplicates
export const favoritesUniqueIndex = sqliteTable(
  'favorites_unique_index',
  {
    userId: text('user_id').notNull(),
    favoriteType: text('favorite_type').notNull(),
    favoriteId: text('favorite_id').notNull(),
  }
);

export type FavoriteChemicals = typeof favorite_chemicals.$inferSelect;
export type NewFavoriteChemical = typeof favorite_chemicals.$inferInsert;