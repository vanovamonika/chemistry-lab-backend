import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { chemicals } from './chemicals';
import { equipmentInstances } from './equipmentInstances';

export const chemicalContent = sqliteTable('chemical_content', {
  id: text('id').primaryKey(),
  chemicalId: text('chemical_id').references(() => chemicals.id).notNull(),
  equipmentInstanceId: text('equipment_instance_id').references(() => equipmentInstances.id).notNull(),
  volume: real('volume').notNull(), // Volume of water in aqueous solution OR volume of liquid
  weight: real('weight'), // Weight of solid chemical (optional, only for solids)
  molarConcentration: real('molar_concentration'), // c = weight / (volume * molar_mass), saved for liquids and aqueous solutions
  color: text('color').notNull(),
  state: text('state', { enum: ['liquid', 'solid', 'gas', 'aqueous'] }).notNull(),
});

export type ChemicalContent = typeof chemicalContent.$inferSelect;
export type NewChemicalContent = typeof chemicalContent.$inferInsert;
