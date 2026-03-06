import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { favorite_chemicals } from '../db/schema';

export const favoriteService = {
  addFavorite: async (userId: string, favoriteId: string, note?: string) => {
    try {
      const newFavorite = await db
        .insert(favorite_chemicals)
        .values({
          id: uuidv4(),
          userId,
          favoriteId,
          note,
          createdAt: new Date(),
        })
        .returning();

      return {
        success: true,
        message: 'Chemical added to favorites',
        favorite: newFavorite[0],
      };
    } catch (error) {
      console.error('Error adding favorite:', error);
      return {
        success: false,
        message: 'Error adding to favorites',
      };
    }
  },

  removeFavorite: async (userId: string, favoriteId: string) => {
    try {
      const found = await db
        .select()
        .from(favorite_chemicals)
        .where(
          and(
            eq(favorite_chemicals.userId, userId),
            eq(favorite_chemicals.favoriteId, favoriteId)
          )
        )
        .limit(1);

      if (found.length === 0) {
        return {
          success: false,
          message: 'Favorite not found',
        };
      }

      await db
        .delete(favorite_chemicals)
        .where(
          and(
            eq(favorite_chemicals.userId, userId),
            eq(favorite_chemicals.favoriteId, favoriteId)
          )
        );

      return {
        success: true,
        message: 'Chemical removed from favorites',
      };
    } catch (error) {
      console.error('Error removing favorite:', error);
      return {
        success: false,
        message: 'Error removing from favorites',
      };
    }
  },

  getUserFavorites: async (userId: string) => {
    try {
      const favorites = await db
        .select()
        .from(favorite_chemicals)
        .where(eq(favorite_chemicals.userId, userId));

      return {
        success: true,
        favorites,
      };
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return {
        success: false,
        message: 'Error fetching favorites',
      };
    }
  },

  isFavorite: async (userId: string, favoriteId: string) => {
    try {
      const found = await db
        .select()
        .from(favorite_chemicals)
        .where(
          and(
            eq(favorite_chemicals.userId, userId),
            eq(favorite_chemicals.favoriteId, favoriteId)
          )
        )
        .limit(1);

      return {
        success: true,
        isFavorite: found.length > 0,
      };
    } catch (error) {
      console.error('Error checking favorite:', error);
      return {
        success: false,
        message: 'Error checking favorite',
      };
    }
  },
};
