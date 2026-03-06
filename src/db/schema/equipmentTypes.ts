// src/db/schema/equipmentTypes.ts
import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const equipmentTypes = sqliteTable('equipment_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // e.g., "Beaker"
  type: text('type', { enum: ['beaker', 'testTube', 'flask', 'burette', 'erlenmeyer'] }).notNull(),
  defaultCapacity: real('default_capacity').notNull(), // in mL
  description: text('description'),
  // Visual properties
  icon: text('icon'),
  isPublic: integer('is_public').default(1),
});

export type EquipmentType = typeof equipmentTypes.$inferSelect;
export type NewEquipmentType = typeof equipmentTypes.$inferInsert;