import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { chemicals, equipmentInstances, equipmentTypes } from '../db/schema';

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

type ContentState = 'liquid' | 'solid' | 'gas' | 'aqueous';

type EquipmentContentItem = {
  chemicalId: string;
  volume?: number;
  weight?: number;
  molarConcentration?: number;
  color?: string;
  state?: ContentState;
};

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeContents = async (contents: unknown): Promise<EquipmentContentItem[] | undefined> => {
  if (!Array.isArray(contents)) return contents as EquipmentContentItem[] | undefined;

  const inputItems = contents as EquipmentContentItem[];
  const chemicalIds = Array.from(new Set(inputItems.map((item) => item?.chemicalId).filter(Boolean))) as string[];

  if (chemicalIds.length === 0) return [];

  const dbChemicals = await db
    .select({
      id: chemicals.id,
      state: chemicals.state,
      molarMass: chemicals.molarMass,
    })
    .from(chemicals);

  const chemicalMap = new Map(dbChemicals.map((c) => [c.id, c]));

  const normalized = inputItems.map((item) => {
    const chemical = chemicalMap.get(item.chemicalId);
    const effectiveState = (item.state || chemical?.state || 'liquid') as ContentState;

    const volume = effectiveState === 'liquid' || effectiveState === 'aqueous'
      ? Math.max(0, toNumber(item.volume))
      : 0;

    const weight = effectiveState === 'solid' || effectiveState === 'aqueous'
      ? Math.max(0, toNumber(item.weight))
      : 0;

    const molarConcentration =
      effectiveState === 'aqueous' && chemical?.molarMass && volume > 0
        ? weight / (volume * chemical.molarMass)
        : item.molarConcentration;

    return {
      ...item,
      state: effectiveState,
      volume,
      weight,
      molarConcentration,
    };
  });

  return normalized;
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

  createEquipmentInstance: async (userId: string | undefined, input: CreateEquipmentInstanceInput) => {
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

      const normalizedContents = await normalizeContents(input.contents);

      const newEquipmentInstance = await db
        .insert(equipmentInstances)
        .values({
          id: uuidv4(),
          userId: userId || null, // null for guest users
          typeId: input.typeId,
          name: input.name,
          currentWorkspaceId: input.currentWorkspaceId,
          positionX: input.positionX,
          positionY: input.positionY,
          contents: normalizedContents,
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

      const normalizedContents = input.contents !== undefined
        ? await normalizeContents(input.contents)
        : undefined;

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.typeId !== undefined) updateData.typeId = input.typeId;
      if (input.currentWorkspaceId !== undefined) updateData.currentWorkspaceId = input.currentWorkspaceId;
      if (input.positionX !== undefined) updateData.positionX = input.positionX;
      if (input.positionY !== undefined) updateData.positionY = input.positionY;
      if (normalizedContents !== undefined) updateData.contents = normalizedContents;
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
