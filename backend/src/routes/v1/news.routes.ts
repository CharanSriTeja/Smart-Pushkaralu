import { Router } from 'express';
import { NewsController } from '../../modules/news/news.controller.js';

export const newsRouter = Router();

// GET /v1/news (filters: ghat, category, language; pinned first; hide expired)
newsRouter.get('/news', NewsController.listNews);

// GET /v1/news/:id
newsRouter.get('/news/:id', NewsController.getNewsById);
