import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { chemicals } from './chemicals';
import { equipmentInstances } from './equipmentInstances';

export const chemicalContent = sqliteTable('chemical_content', {
  id: text('id').primaryKey(),
  chemicalId: text('chemical_id').references(() => chemicals.id).notNull(),
  equipmentInstanceId: text('equipment_instance_id').references(() => equipmentInstances.id).notNull(),
  volume: real('volume').notNull(),
  color: text('color').notNull(),
  state: text('state', { enum: ['liquid', 'solid', 'gas', 'aqueous'] }).notNull(),
});

export type ChemicalContent = typeof chemicalContent.$inferSelect;
export type NewChemicalContent = typeof chemicalContent.$inferInsert;
