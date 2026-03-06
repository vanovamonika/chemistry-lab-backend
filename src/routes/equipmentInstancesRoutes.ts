import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, optionalAuthMiddleware } from '../auth/middleware';
import { equipmentInstanceService } from '../services/equipmentInstanceService';

const router = Router();

const idSchema = z.object({
  id: z.string().min(1, 'Equipment instance id is required'),
});

const createEquipmentInstanceSchema = z.object({
  typeId: z.string().min(1, 'typeId is required'),
  name: z.string().optional(),
  currentWorkspaceId: z.string().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  contents: z.any().optional(),
  temperature: z.number().optional(),
  isReacting: z.number().int().optional(),
});

const updateEquipmentInstanceSchema = createEquipmentInstanceSchema.partial();

router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Auth is optional for GET - guests get no equipment, authenticated users get their own
    if (!req.user?.userId) {
      // Guest user - return empty equipment list
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const result = await equipmentInstanceService.getUserEquipmentInstances(req.user.userId);
    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get equipment instances error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const parsed = idSchema.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.flatten(),
      });
    }

    const result = await equipmentInstanceService.getEquipmentInstanceById(parsed.data.id);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get equipment instance by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = createEquipmentInstanceSchema.safeParse(req.body);

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

    const result = await equipmentInstanceService.createEquipmentInstance(req.user.userId, parsed.data);
    const statusCode = result.success ? 201 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Create equipment instance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsedId = idSchema.safeParse(req.params);

    if (!parsedId.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsedId.error.flatten(),
      });
    }

    const parsedBody = updateEquipmentInstanceSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsedBody.error.flatten(),
      });
    }

    const result = await equipmentInstanceService.updateEquipmentInstance(parsedId.data.id, parsedBody.data);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Update equipment instance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsedId = idSchema.safeParse(req.params);

    if (!parsedId.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsedId.error.flatten(),
      });
    }

    const parsedBody = updateEquipmentInstanceSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsedBody.error.flatten(),
      });
    }

    const result = await equipmentInstanceService.updateEquipmentInstance(parsedId.data.id, parsedBody.data);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Patch equipment instance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = idSchema.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.flatten(),
      });
    }

    const result = await equipmentInstanceService.deleteEquipmentInstance(parsed.data.id);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Delete equipment instance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
