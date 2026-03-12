import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { aiService } from '../services/aiService';

const router = Router();

const chemicalPropertySchema = z.object({
  formula: z.string().min(1, 'Formula is required'),
  name: z.string().optional(),
  conditions: z.string().optional().default('standard conditions'),
});

/**
 * GET /ai/density
 * Predicts the density of a chemical compound
 * Query parameters: formula, name, conditions
 */
router.get('/density', async (req: Request, res: Response) => {
  try {
    const parsed = chemicalPropertySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.flatten(),
      });
    }

    const result = await aiService.predictDensity(
      parsed.data.formula,
      parsed.data.name,
      parsed.data.conditions
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Predict density error:', error);
    res.status(500).json({
      success: false,
      value: null,
      message: 'Internal server error',
    });
  }
});

/**
 * GET /ai/molar-mass
 * Predicts the molar mass of a chemical compound
 * Query parameters: formula, name, conditions
 */
router.get('/molar-mass', async (req: Request, res: Response) => {
  try {
    const parsed = chemicalPropertySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.flatten(),
      });
    }

    const result = await aiService.predictMolarMass(
      parsed.data.formula,
      parsed.data.name,
      parsed.data.conditions
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Predict molar mass error:', error);
    res.status(500).json({
      success: false,
      value: null,
      message: 'Internal server error',
    });
  }
});

export default router;
