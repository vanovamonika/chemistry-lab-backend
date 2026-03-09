import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { workspaces } from './workspaces';
import { chemicals } from './chemicals';
import { sql } from 'drizzle-orm';

/**
 * Workspace Inventory - stores chemicals with their specific concentrations per workspace
 * 
 * Key Concepts:
 * - Base chemicals (in `chemicals` table) are always 100% pure
 * - When a user mixes chemicals in a workspace, the resulting mixture is stored here with its calculated concentration
 * - When chemicals are created through reactions, they're added to both:
 *   1. `chemicals` table as 100% pure chemical
 *   2. `workspaceInventory` with the actual concentration from the reaction
 * - Amount tracking: only the mixed/created amount is available; when used up, the entry is removed
 */
export const workspaceInventory = sqliteTable('workspace_inventory', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').references(() => workspaces.id).notNull(),
  chemicalId: text('chemical_id').references(() => chemicals.id).notNull(),
  
  // Concentration (percentage, 0-100)
  // For pure chemicals: 100
  // For mixtures: calculated based on molar mass, volume, weight
  concentration: real('concentration').notNull().default(100),
  
  // Available amount
  volume: real('volume'), // For liquids/aqueous (mL)
  weight: real('weight'), // For solids (g)
  
  // Molar concentration for aqueous solutions
  // c = n/V = (weight / molarMass) / volume
  molarConcentration: real('molar_concentration'),
  
  // Storage metadata
  containerType: text('container_type'), // 'beaker', 'flask', 'bottle', etc.
  label: text('label'), // User-defined label for this specific mixture
  
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`),
});

export type WorkspaceInventoryItem = typeof workspaceInventory.$inferSelect;
export type NewWorkspaceInventoryItem = typeof workspaceInventory.$inferInsert;
