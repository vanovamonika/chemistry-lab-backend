// src/db/schema/equipmentInstances.ts
import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { equipmentTypes } from './equipmentTypes';
import { workspaces } from './workspaces';

export const equipmentInstances = sqliteTable('equipment_instances', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id), // Optional - null for guest users
  typeId: text('type_id').references(() => equipmentTypes.id).notNull(),
  name: text('name'), // optional custom name
  // Current state (could also be stored in workspace snapshot)
  currentWorkspaceId: text('current_workspace_id').references(() => workspaces.id),
  positionX: real('position_x'),
  positionY: real('position_y'),
  contents: text('contents', { mode: 'json' }), // array of ChemicalContent
  temperature: real('temperature').default(25),
  isReacting: integer('is_reacting').default(0),
  // ... other state fields
});

export type EquipmentInstance = typeof equipmentInstances.$inferSelect;
export type NewEquipmentInstance = typeof equipmentInstances.$inferInsert;