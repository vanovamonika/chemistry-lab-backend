import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { sql } from 'drizzle-orm';

export const reactions = sqliteTable('reactions', {
  id: text('id').primaryKey(),
  
  // Reactants and products stored as arrays of chemical IDs or formulas
  reactants: text('reactants', { mode: 'json' }).notNull(), // Array of {chemicalId?: string, formula: string, volume?: number}
  products: text('products', { mode: 'json' }).notNull(), // Array of {chemicalId?: string, formula: string, volume?: number}
  
  // Reaction details
  equation: text('equation').notNull(), // Balanced equation string
  reactionType: text('reaction_type'), // synthesis, decomposition, displacement, etc.
  
  // Conditions
  temperature: real('temperature'),
  pressure: real('pressure'),
  conditions: text('conditions'), // e.g., "catalyst", "light", "electrolysis"
  
  // Visual results (matching your ReactionResult interface)
  color: text('color'),
  bubbles: integer('bubbles', { mode: 'boolean' }).default(false),
  heat: integer('heat', { mode: 'boolean' }).default(false),
  precipitate: integer('precipitate', { mode: 'boolean' }).default(false),
  gas: text('gas'),
  visualDescription: text('visual_description'),
  
  // Safety
  safetyWarnings: text('safety_warnings', { mode: 'json' }),
  
  // Metadata
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
  verifiedById: text('verified_by_id').references(() => users.id),
  verifiedAt: integer('verified_at', { mode: 'timestamp' }),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  createdById: text('created_by_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`),
});

export type Reaction = typeof reactions.$inferSelect;
export type NewReaction = typeof reactions.$inferInsert;