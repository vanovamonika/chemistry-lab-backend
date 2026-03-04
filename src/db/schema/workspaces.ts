import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { sql } from 'drizzle-orm';

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  
  // Store the entire lab state (matching your LabState interface)
  labState: text('lab_state', { mode: 'json' }).notNull(),
  
  // Equipment arrangement
  equipmentPositions: text('equipment_positions', { mode: 'json' }),
  
  // Active experiments
  activeReactions: text('active_reactions', { mode: 'json' }),
  
  // Environment
  labTemperature: real('lab_temperature').default(25),
  isFumeHoodActive: integer('is_fume_hood_active', { mode: 'boolean' }).default(false),
});

// For version history/auto-save
export const workspaceHistory = sqliteTable('workspace_history', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').references(() => workspaces.id).notNull(),
  snapshot: text('snapshot', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`),
});

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;