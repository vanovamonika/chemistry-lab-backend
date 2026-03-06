import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../auth/middleware';
import { favoriteService } from '../services/favoriteService';

const router = Router();

const addFavoriteSchema = z.object({
  favoriteId: z.string().min(1, 'favoriteId is required'),
  note: z.string().optional(),
});

const removeFavoriteSchema = z.object({
  favoriteId: z.string().min(1, 'favoriteId is required'),
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = addFavoriteSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.flatten(),
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await favoriteService.addFavorite(
      req.user.userId,
      parsed.data.favoriteId,
      parsed.data.note
    );

    const statusCode = result.success ? 201 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.delete('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = removeFavoriteSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.flatten(),
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await favoriteService.removeFavorite(
      req.user.userId,
      parsed.data.favoriteId
    );

    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await favoriteService.getUserFavorites(req.user.userId);
    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.post('/check/:favoriteId', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await favoriteService.isFavorite(req.user.userId, req.params.favoriteId);
    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
