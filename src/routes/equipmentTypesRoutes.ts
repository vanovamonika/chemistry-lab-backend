import { Router, Request, Response } from 'express';
import { equipmentTypeService } from '../services/equipmentTypeService';

const router = Router();

// Get all equipment types
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await equipmentTypeService.getAllEquipmentTypes();
    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get equipment types error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
