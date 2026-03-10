/**
 * Workspace Inventory Routes
 * API endpoints for managing workspace-specific chemical inventory
 */

import { Router } from 'express';
import { workspaceInventoryService } from '../services/workspaceInventoryService';
import { authMiddleware } from '../auth/middleware';

const router = Router();

/**
 * GET /api/workspace-inventory/:workspaceId
 * Get all inventory items for a workspace
 */
router.get('/:workspaceId', authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const items = await workspaceInventoryService.getByWorkspaceId(workspaceId);
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching workspace inventory:', error);
    res.status(500).json({ error: 'Failed to fetch workspace inventory' });
  }
});

/**
 * POST /api/workspace-inventory
 * Create a new workspace inventory item
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const item = await workspaceInventoryService.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating workspace inventory item:', error);
    res.status(500).json({ error: 'Failed to create workspace inventory item' });
  }
});

/**
 * PATCH /api/workspace-inventory/:id/amount
 * Update amount of workspace inventory item
 */
router.patch('/:id/amount', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { volume, weight } = req.body;
    
    const item = await workspaceInventoryService.updateAmount(id, volume, weight);
    res.json(item ?? { success: true, id, volume, weight });
  } catch (error) {
    console.error('Error updating workspace inventory amount:', error);
    res.status(500).json({ error: 'Failed to update amount' });
  }
});

/**
 * DELETE /api/workspace-inventory/:id
 * Delete a workspace inventory item
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await workspaceInventoryService.delete(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting workspace inventory item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
