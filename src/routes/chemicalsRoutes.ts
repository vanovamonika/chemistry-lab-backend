import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, optionalAuthMiddleware } from '../auth/middleware';
import { chemicalService } from '../services/chemicalService';

const router = Router();

const idSchema = z.object({
  id: z.string().min(1, 'Chemical id is required'),
});

const createChemicalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  formula: z.string().min(1, 'Formula is required'),
  colorHex: z.string().optional(),
  color: z.string().optional(),
  state: z.enum(['liquid', 'solid', 'gas', 'aqueous']),
  solubleInWater: z.boolean().optional(),
  opacity: z.number().min(0).max(1).optional(),
  hasRefraction: z.boolean().optional(),
  molarMass: z.number().positive().optional(),
  density: z.number().positive().optional(),
  isPublic: z.boolean().optional(),
});

const updateChemicalSchema = createChemicalSchema.partial();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await chemicalService.getAllChemicals();
    const statusCode = result.success ? 200 : 500;
    // Transform response to match expected format
    res.status(statusCode).json({
      success: result.success,
      data: result.chemicals || [],
      message: result.message,
    });
  } catch (error) {
    console.error('Get chemicals error:', error);
    res.status(500).json({
      success: false,
      data: [],
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

    const result = await chemicalService.getChemicalById(parsed.data.id);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get chemical by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.post('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = createChemicalSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.flatten(),
      });
    }

    const result = await chemicalService.createChemical(req.user?.userId, parsed.data);
    const statusCode = result.success ? 201 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Create chemical error:', error);
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

    const parsedBody = updateChemicalSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsedBody.error.flatten(),
      });
    }

    const result = await chemicalService.updateChemical(parsedId.data.id, parsedBody.data);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Update chemical error:', error);
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

    const parsedBody = updateChemicalSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsedBody.error.flatten(),
      });
    }

    const result = await chemicalService.updateChemical(parsedId.data.id, parsedBody.data);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Patch chemical error:', error);
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

    const result = await chemicalService.deleteChemical(parsed.data.id);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Delete chemical error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
