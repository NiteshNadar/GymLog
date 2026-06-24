import { Router } from 'express';
import { WorkoutController } from './workout.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { createWorkoutSchema, updateWorkoutSchema, idParamsSchema, paginationQuerySchema } from './workout.schema.js';

const router = Router();

router.use(requireAuth);

router.post('/', validate({ body: createWorkoutSchema }), WorkoutController.create);
router.get('/', validate({ query: paginationQuerySchema }), WorkoutController.getAll);
router.delete('/clear-all', WorkoutController.clearAll); // Mount before :id to prevent conflict
router.get('/:id', validate({ params: idParamsSchema }), WorkoutController.getById);
router.patch('/:id', validate({ params: idParamsSchema, body: updateWorkoutSchema }), WorkoutController.update);
router.delete('/:id', validate({ params: idParamsSchema }), WorkoutController.delete);

export default router;
