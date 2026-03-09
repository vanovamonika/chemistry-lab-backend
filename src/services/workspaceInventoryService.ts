/**
 * Workspace Inventory Service
 * Handles workspace-specific chemical inventory with concentrations
 */

import { db } from '../db';
import { workspaceInventory } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const workspaceInventoryService = {
  /**
   * Get all workspace inventory items for a specific workspace
   */
  getByWorkspaceId: async (workspaceId: string) => {
    try {
      const items = await db
        .select()
        .from(workspaceInventory)
        .where(eq(workspaceInventory.workspaceId, workspaceId));
      
      return items;
    } catch (error) {
      console.error('Error fetching workspace inventory:', error);
      throw error;
    }
  },

  /**
   * Create a new workspace inventory item
   */
  create: async (data: {
    workspaceId: string;
    chemicalId: string;
    concentration: number;
    volume?: number;
    weight?: number;
    molarConcentration?: number;
    containerType?: string;
    label?: string;
  }) => {
    try {
      const id = uuidv4();
      const [item] = await db
        .insert(workspaceInventory)
        .values({
          id,
          ...data,
        })
        .returning();
      
      return item;
    } catch (error) {
      console.error('Error creating workspace inventory item:', error);
      throw error;
    }
  },

  /**
   * Update workspace inventory item amount
   */
  updateAmount: async (id: string, volume?: number, weight?: number) => {
    try {
      const [item] = await db
        .update(workspaceInventory)
        .set({
          volume,
          weight,
          updatedAt: new Date(),
        })
        .where(eq(workspaceInventory.id, id))
        .returning();
      
      return item;
    } catch (error) {
      console.error('Error updating workspace inventory amount:', error);
      throw error;
    }
  },

  /**
   * Delete workspace inventory item
   */
  delete: async (id: string) => {
    try {
      await db
        .delete(workspaceInventory)
        .where(eq(workspaceInventory.id, id));
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting workspace inventory item:', error);
      throw error;
    }
  },
};
