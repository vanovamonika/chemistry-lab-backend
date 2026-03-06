import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { workspaces, workspaceHistory } from '../db/schema';

export type CreateWorkspaceInput = {
  name: string;
  description?: string;
  labState: unknown;
  equipmentPositions?: unknown;
  activeReactions?: unknown;
  labTemperature?: number;
  isFumeHoodActive?: boolean;
};

export const workspaceService = {
  getAllWorkspaces: async (userId: string) => {
    try {
      const allWorkspaces = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.userId, userId));

      return {
        success: true,
        workspaces: allWorkspaces,
      };
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      return {
        success: false,
        message: 'Error fetching workspaces',
      };
    }
  },

  getWorkspaceById: async (userId: string, id: string) => {
    try {
      const found = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, id))
        .limit(1);

      if (found.length === 0) {
        return {
          success: false,
          message: 'Workspace not found',
        };
      }

      if (found[0].userId !== userId) {
        return {
          success: false,
          message: 'Unauthorized',
        };
      }

      return {
        success: true,
        workspace: found[0],
      };
    } catch (error) {
      console.error('Error fetching workspace by id:', error);
      return {
        success: false,
        message: 'Error fetching workspace',
      };
    }
  },

  createWorkspace: async (userId: string, input: CreateWorkspaceInput) => {
    try {
      const newWorkspace = await db
        .insert(workspaces)
        .values({
          id: uuidv4(),
          userId,
          name: input.name,
          description: input.description,
          labState: input.labState,
          equipmentPositions: input.equipmentPositions,
          activeReactions: input.activeReactions,
          labTemperature: input.labTemperature ?? 25,
          isFumeHoodActive: input.isFumeHoodActive ?? false,
        })
        .returning();

      return {
        success: true,
        message: 'Workspace created successfully',
        workspace: newWorkspace[0],
      };
    } catch (error) {
      console.error('Error creating workspace:', error);
      return {
        success: false,
        message: 'Error creating workspace',
      };
    }
  },

  updateWorkspace: async (userId: string, id: string, input: Partial<CreateWorkspaceInput>) => {
    try {
      const found = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, id))
        .limit(1);

      if (found.length === 0) {
        return {
          success: false,
          message: 'Workspace not found',
        };
      }

      if (found[0].userId !== userId) {
        return {
          success: false,
          message: 'Unauthorized',
        };
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.labState !== undefined) updateData.labState = input.labState;
      if (input.equipmentPositions !== undefined) updateData.equipmentPositions = input.equipmentPositions;
      if (input.activeReactions !== undefined) updateData.activeReactions = input.activeReactions;
      if (input.labTemperature !== undefined) updateData.labTemperature = input.labTemperature;
      if (input.isFumeHoodActive !== undefined) updateData.isFumeHoodActive = input.isFumeHoodActive;

      const updated = await db
        .update(workspaces)
        .set(updateData)
        .where(eq(workspaces.id, id))
        .returning();

      return {
        success: true,
        message: 'Workspace updated successfully',
        workspace: updated[0],
      };
    } catch (error) {
      console.error('Error updating workspace:', error);
      return {
        success: false,
        message: 'Error updating workspace',
      };
    }
  },

  deleteWorkspace: async (userId: string, id: string) => {
    try {
      const found = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, id))
        .limit(1);

      if (found.length === 0) {
        return {
          success: false,
          message: 'Workspace not found',
        };
      }

      if (found[0].userId !== userId) {
        return {
          success: false,
          message: 'Unauthorized',
        };
      }

      await db.delete(workspaces).where(eq(workspaces.id, id));

      return {
        success: true,
        message: 'Workspace deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting workspace:', error);
      return {
        success: false,
        message: 'Error deleting workspace',
      };
    }
  },

  saveWorkspaceSnapshot: async (userId: string, workspaceId: string, snapshot: unknown) => {
    try {
      const found = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);

      if (found.length === 0) {
        return {
          success: false,
          message: 'Workspace not found',
        };
      }

      if (found[0].userId !== userId) {
        return {
          success: false,
          message: 'Unauthorized',
        };
      }

      const history = await db
        .insert(workspaceHistory)
        .values({
          id: uuidv4(),
          workspaceId,
          snapshot,
          createdAt: new Date(),
        })
        .returning();

      return {
        success: true,
        message: 'Workspace snapshot saved',
        snapshot: history[0],
      };
    } catch (error) {
      console.error('Error saving workspace snapshot:', error);
      return {
        success: false,
        message: 'Error saving workspace snapshot',
      };
    }
  },
};
