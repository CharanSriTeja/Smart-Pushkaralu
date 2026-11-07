import { Router } from 'express';
import { requireAuth, requireAdmin, can } from '../../middleware/auth.js';
import { sevaController } from '../../modules/seva/seva.controller.js';

export const adminSevaRouter = Router();

// Protect all admin Seva management routes
adminSevaRouter.use(requireAuth, requireAdmin);

adminSevaRouter.get('/', can('seva.manage'), (req, res) => sevaController.getAdminVideos(req, res));
adminSevaRouter.post('/', can('seva.manage'), (req, res) => sevaController.createAdminVideo(req, res));
adminSevaRouter.patch('/:id', can('seva.manage'), (req, res) => sevaController.patchAdminVideo(req, res));
adminSevaRouter.delete('/:id', can('seva.manage'), (req, res) => sevaController.deleteAdminVideo(req, res));
adminSevaRouter.put('/reorder', can('seva.manage'), (req, res) => sevaController.reorderAdminVideos(req, res));

