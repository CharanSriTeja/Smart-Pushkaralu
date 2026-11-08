import { Router } from 'express';
import { sevaController } from '../../modules/seva/seva.controller.js';

export const sevaRouter = Router();

// Public Feed of Seva Videos
sevaRouter.get('/', (req, res) => sevaController.getPublicVideos(req, res));
sevaRouter.get('/:id', (req, res) => sevaController.getPublicVideoById(req, res));

