import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { equipmentInstances, equipmentTypes } from '../db/schema';

export type CreateEquipmentInstanceInput = {
  typeId: string;
  name?: string;
  currentWorkspaceId?: string;
  positionX?: number;
  positionY?: number;
  contents?: unknown;
  temperature?: number;
  isReacting?: number;
};

export const equipmentInstanceService = {
  getAllEquipmentInstances: async () => {
    try {
      const allEquipmentInstances = await db
        .select()
        .from(equipmentInstances);

      return {
        success: true,
        equipmentInstances: allEquipmentInstances,
      };
    } catch (error) {
      console.error('Error fetching equipment instances:', error);
      return {
        success: false,
        message: 'Error fetching equipment instances',
      };
    }
  },

  getUserEquipmentInstances: async (userId: string) => {
    try {
      const userEquipmentInstances = await db
        .select({
          id: equipmentInstances.id,
          userId: equipmentInstances.userId,
          typeId: equipmentInstances.typeId,
          name: equipmentInstances.name,
          currentWorkspaceId: equipmentInstances.currentWorkspaceId,
          positionX: equipmentInstances.positionX,
          positionY: equipmentInstances.positionY,
          contents: equipmentInstances.contents,
          temperature: equipmentInstances.temperature,
          isReacting: equipmentInstances.isReacting,
          // Join with equipment types to get capacity and type
          type: equipmentTypes.type,
          capacity: equipmentTypes.defaultCapacity,
        })
        .from(equipmentInstances)
        .leftJoin(equipmentTypes, eq(equipmentInstances.typeId, equipmentTypes.id))
        .where(eq(equipmentInstances.userId, userId));

      return {
        success: true,
        data: userEquipmentInstances,
      };
    } catch (error) {
      console.error('Error fetching user equipment instances:', error);
      return {
        success: false,
        message: 'Error fetching user equipment instances',
      };
    }
  },

  getEquipmentInstanceById: async (id: string) => {
    try {
      const found = await db
        .select()
        .from(equipmentInstances)
        .where(eq(equipmentInstances.id, id))
        .limit(1);

      if (found.length === 0) {
        return {
          success: false,
          message: 'Equipment instance not found',
        };
      }

      return {
        success: true,
        equipmentInstance: found[0],
      };
    } catch (error) {
      console.error('Error fetching equipment instance by id:', error);
      return {
        success: false,
        message: 'Error fetching equipment instance',
      };
    }
  },

  createEquipmentInstance: async (userId: string, input: CreateEquipmentInstanceInput) => {
    try {
      const foundEquipmentType = await db
        .select({ id: equipmentTypes.id })
        .from(equipmentTypes)
        .where(eq(equipmentTypes.id, input.typeId))
        .limit(1);

      if (foundEquipmentType.length === 0) {
        return {
          success: false,
          message: 'Equipment type not found',
        };
      }

      const newEquipmentInstance = await db
        .insert(equipmentInstances)
        .values({
          id: uuidv4(),
          userId,
          typeId: input.typeId,
          name: input.name,
          currentWorkspaceId: input.currentWorkspaceId,
          positionX: input.positionX,
          positionY: input.positionY,
          contents: input.contents,
          temperature: input.temperature,
          isReacting: input.isReacting,
        })
        .returning();

      return {
        success: true,
        message: 'Equipment instance created successfully',
        equipmentInstance: newEquipmentInstance[0],
      };
    } catch (error) {
      console.error('Error creating equipment instance:', error);
      return {
        success: false,
        message: 'Error creating equipment instance',
      };
    }
  },

  updateEquipmentInstance: async (id: string, input: Partial<CreateEquipmentInstanceInput>) => {
    try {
      const found = await db
        .select()
        .from(equipmentInstances)
        .where(eq(equipmentInstances.id, id))
        .limit(1);

      if (found.length === 0) {
        return {
          success: false,
          message: 'Equipment instance not found',
        };
      }

      if (input.typeId !== undefined) {
        const foundEquipmentType = await db
          .select({ id: equipmentTypes.id })
          .from(equipmentTypes)
          .where(eq(equipmentTypes.id, input.typeId))
          .limit(1);

        if (foundEquipmentType.length === 0) {
          return {
            success: false,
            message: 'Equipment type not found',
          };
        }
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.typeId !== undefined) updateData.typeId = input.typeId;
      if (input.currentWorkspaceId !== undefined) updateData.currentWorkspaceId = input.currentWorkspaceId;
      if (input.positionX !== undefined) updateData.positionX = input.positionX;
      if (input.positionY !== undefined) updateData.positionY = input.positionY;
      if (input.contents !== undefined) updateData.contents = input.contents;
      if (input.temperature !== undefined) updateData.temperature = input.temperature;
      if (input.isReacting !== undefined) updateData.isReacting = input.isReacting;

      const updated = await db
        .update(equipmentInstances)
        .set(updateData)
        .where(eq(equipmentInstances.id, id))
        .returning();

      return {
        success: true,
        message: 'Equipment instance updated successfully',
        equipmentInstance: updated[0],
      };
    } catch (error) {
      console.error('Error updating equipment instance:', error);
      return {
        success: false,
        message: 'Error updating equipment instance',
      };
    }
  },

  deleteEquipmentInstance: async (id: string) => {
    try {
      const found = await db
        .select()
        .from(equipmentInstances)
        .where(eq(equipmentInstances.id, id))
        .limit(1);

      if (found.length === 0) {
        return {
          success: false,
          message: 'Equipment instance not found',
        };
      }

      await db.delete(equipmentInstances).where(eq(equipmentInstances.id, id));

      return {
        success: true,
        message: 'Equipment instance deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting equipment instance:', error);
      return {
        success: false,
        message: 'Error deleting equipment instance',
      };
    }
  },
};
