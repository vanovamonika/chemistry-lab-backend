import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../auth/middleware';
import { optionalAuthMiddleware } from '../auth/middleware';
import { reactionService } from '../services/reactionService';

const router = Router();

const reactantsParser = z.preprocess(
  (value) => {
    if (typeof value === 'string') {
      return value
        .split('+')
        .map((part) => part.trim())
        .filter(Boolean);
    }
    return value;
  },
  z.array(z.string().min(1)).min(2, 'At least two reactants are required')
);

const productsParser = z.preprocess(
  (value) => {
    if (typeof value === 'string') {
      return value
        .split('+')
        .map((part) => part.trim())
        .filter(Boolean);
    }
    return value;
  },
  z.array(z.string().min(1)).min(1, 'At least one product is required')
);

const findReactionSchema = z.object({
  reactants: reactantsParser,
  temperature: z.number().optional(),
});

const createReactionSchema = z.object({
  reactants: reactantsParser,
  products: productsParser,
  equation: z.string().optional(),
  reactionType: z.string().optional(),
  temperature: z.number().optional(),
  pressure: z.number().optional(),
  conditions: z.string().optional(),
  color: z.string().optional(),
  bubbles: z.boolean().optional(),
  heat: z.boolean().optional(),
  precipitate: z.boolean().optional(),
  gas: z.string().optional(),
  visualDescription: z.string().optional(),
  safetyWarnings: z.array(z.string()).optional(),
  isVerified: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

router.post('/find', async (req: Request, res: Response) => {
  try {
    const parsed = findReactionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.flatten(),
      });
    }

    const result = await reactionService.findReactionByReactants(
      parsed.data.reactants,
      parsed.data.temperature
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    if (!result.found) {
      return res.status(200).json({
        success: true,
        found: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      found: true,
      reaction: result.reaction,
    });
  } catch (error) {
    console.error('Find reaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.post('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = createReactionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.flatten(),
      });
    }

    const result = await reactionService.createReaction(parsed.data, req.user?.userId);
    const statusCode = result.success ? (result.created ? 201 : 200) : 400;

    return res.status(statusCode).json(result);
  } catch (error) {
    console.error('Create reaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.post('/:id/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const reactionId = req.params.id;
    if (!reactionId) {
      return res.status(400).json({
        success: false,
        message: 'Reaction id is required',
      });
    }

    const result = await reactionService.verifyReaction(reactionId, req.user.userId);
    const statusCode = result.statusCode || (result.success ? 200 : 400);

    return res.status(statusCode).json({
      success: result.success,
      message: result.message,
      reaction: result.reaction,
    });
  } catch (error) {
    console.error('Verify reaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
