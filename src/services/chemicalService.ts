import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { chemicals } from '../db/schema';

export type CreateChemicalInput = {
  name: string;
  formula: string;
  colorHex?: string;
  color?: string;
  state: 'liquid' | 'solid' | 'gas' | 'aqueous';
  solubleInWater?: boolean;
  opacity?: number;
  hasRefraction?: boolean;
  molarMass?: number;
  density?: number;
  isPublic?: boolean;
};

export const chemicalService = {
  getAllChemicals: async () => {
    try {
      const allChemicals = await db.select().from(chemicals);

      return {
        success: true,
        chemicals: allChemicals,
      };
    } catch (error) {
      console.error('Error fetching chemicals:', error);
      return {
        success: false,
        message: 'Error fetching chemicals',
      };
    }
  },

  getChemicalById: async (id: string) => {
    try {
      const found = await db
        .select()
        .from(chemicals)
        .where(eq(chemicals.id, id))
        .limit(1);

      if (found.length === 0) {
        return {
          success: false,
          message: 'Chemical not found',
        };
      }

      return {
        success: true,
        chemical: found[0],
      };
    } catch (error) {
      console.error('Error fetching chemical by id:', error);
      return {
        success: false,
        message: 'Error fetching chemical',
      };
    }
  },

  createChemical: async (userId: string, input: CreateChemicalInput) => {
    try {
      const newChemical = await db
        .insert(chemicals)
        .values({
          id: uuidv4(),
          name: input.name,
          formula: input.formula,
          colorHex: input.colorHex,
          color: input.color,
          state: input.state,
          solubleInWater: input.solubleInWater,
          opacity: input.opacity,
          hasRefraction: input.hasRefraction,
          molarMass: input.molarMass,
          density: input.density,
          isPublic: input.isPublic,
          createdById: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        success: true,
        message: 'Chemical created successfully',
        chemical: newChemical[0],
      };
    } catch (error) {
      console.error('Error creating chemical:', error);
      return {
        success: false,
        message: 'Error creating chemical',
      };
    }
  },

  updateChemical: async (id: string, input: Partial<CreateChemicalInput>) => {
    try {
      const found = await db
        .select()
        .from(chemicals)
        .where(eq(chemicals.id, id))
        .limit(1);

      if (found.length === 0) {
        return {
          success: false,
          message: 'Chemical not found',
        };
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.formula !== undefined) updateData.formula = input.formula;
      if (input.colorHex !== undefined) updateData.colorHex = input.colorHex;
      if (input.color !== undefined) updateData.color = input.color;
      if (input.state !== undefined) updateData.state = input.state;
      if (input.solubleInWater !== undefined) updateData.solubleInWater = input.solubleInWater;
      if (input.opacity !== undefined) updateData.opacity = input.opacity;
      if (input.hasRefraction !== undefined) updateData.hasRefraction = input.hasRefraction;
      if (input.molarMass !== undefined) updateData.molarMass = input.molarMass;
      if (input.density !== undefined) updateData.density = input.density;
      if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;
      updateData.updatedAt = new Date();

      const updated = await db
        .update(chemicals)
        .set(updateData)
        .where(eq(chemicals.id, id))
        .returning();

      return {
        success: true,
        message: 'Chemical updated successfully',
        chemical: updated[0],
      };
    } catch (error) {
      console.error('Error updating chemical:', error);
      return {
        success: false,
        message: 'Error updating chemical',
      };
    }
  },

  deleteChemical: async (id: string) => {
    try {
      const found = await db
        .select()
        .from(chemicals)
        .where(eq(chemicals.id, id))
        .limit(1);

      if (found.length === 0) {
        return {
          success: false,
          message: 'Chemical not found',
        };
      }

      await db.delete(chemicals).where(eq(chemicals.id, id));

      return {
        success: true,
        message: 'Chemical deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting chemical:', error);
      return {
        success: false,
        message: 'Error deleting chemical',
      };
    }
  },
};
