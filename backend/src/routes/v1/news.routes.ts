import { Router } from 'express';
import { NewsController } from '../../modules/news/news.controller.js';
import { publicGhatsLimiter } from '../../middleware/rate-limiter.js';

export const newsRouter = Router();

// Apply public rate limiting
newsRouter.use(publicGhatsLimiter);

// GET /v1/news (filters: ghat, category, language; pinned first; hide expired)
newsRouter.get('/news', NewsController.listNews);

// GET /v1/news/:id
newsRouter.get('/news/:id', NewsController.getNewsById);

