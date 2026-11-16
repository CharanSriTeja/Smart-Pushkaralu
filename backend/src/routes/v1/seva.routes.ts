import { Router, Request, Response } from 'express';
import { sevaController } from '../../modules/seva/seva.controller.js';

export const sevaRouter = Router();

// Public Feed of Seva Videos
sevaRouter.get('/', (req: Request, res: Response) => sevaController.getPublicVideos(req, res));
sevaRouter.get('/:id', (req: Request, res: Response) => sevaController.getPublicVideoById(req, res));
