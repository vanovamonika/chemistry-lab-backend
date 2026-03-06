import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../auth/middleware';
import { workspaceService } from '../services/workspaceService';

const router = Router();

const idSchema = z.object({
  id: z.string().min(1, 'Workspace id is required'),
});

const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  labState: z.record(z.any()),
  equipmentPositions: z.any().optional(),
  activeReactions: z.any().optional(),
  labTemperature: z.number().optional(),
  isFumeHoodActive: z.boolean().optional(),
});

const updateWorkspaceSchema = createWorkspaceSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

const saveSnapshotSchema = z.object({
  snapshot: z.record(z.any()),
});

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await workspaceService.getAllWorkspaces(req.user.userId);
    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = idSchema.safeParse(req.params);

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

    const result = await workspaceService.getWorkspaceById(req.user.userId, parsed.data.id);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get workspace by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = createWorkspaceSchema.safeParse(req.body);

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

    const result = await workspaceService.createWorkspace(req.user.userId, parsed.data);
    const statusCode = result.success ? 201 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Create workspace error:', error);
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

    const parsedBody = updateWorkspaceSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsedBody.error.flatten(),
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await workspaceService.updateWorkspace(req.user.userId, parsedId.data.id, parsedBody.data);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Update workspace error:', error);
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

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await workspaceService.deleteWorkspace(req.user.userId, parsed.data.id);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Delete workspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.post('/:id/snapshot', authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsedId = idSchema.safeParse(req.params);

    if (!parsedId.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsedId.error.flatten(),
      });
    }

    const parsedBody = saveSnapshotSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsedBody.error.flatten(),
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await workspaceService.saveWorkspaceSnapshot(
      req.user.userId,
      parsedId.data.id,
      parsedBody.data.snapshot
    );

    const statusCode = result.success ? 201 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Save workspace snapshot error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
