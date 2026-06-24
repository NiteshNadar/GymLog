import { Router } from 'express';
import { UserController } from './user.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

import { validate } from '../../middleware/validate.js';
import { deleteUserSchema } from './user.schema.js';

const router = Router();

router.get('/me', requireAuth, UserController.getMe);
router.get('/me/export', requireAuth, UserController.exportData);
router.delete('/me', requireAuth, validate({ body: deleteUserSchema }), UserController.deleteMe);

export default router;
