import { eq } from 'drizzle-orm';
import { db } from '../db';
import { equipmentTypes } from '../db/schema';

export const equipmentTypeService = {
  getAllEquipmentTypes: async () => {
    try {
      const allEquipmentTypes = await db
        .select()
        .from(equipmentTypes)
        .where(eq(equipmentTypes.isPublic, 1));

      return {
        success: true,
        data: allEquipmentTypes,
      };
    } catch (error) {
      console.error('Error fetching equipment types:', error);
      return {
        success: false,
        message: 'Error fetching equipment types',
      };
    }
  },
};
