import { Router } from 'express';
import { ExerciseController } from './exercise.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { createExerciseSchema, updateExerciseSchema, bulkCreateExerciseSchema, idParamsSchema, exerciseQuerySchema, workoutIdParamsSchema } from './exercise.schema.js';

const router = Router();

router.use(requireAuth);

router.post('/bulk', validate({ body: bulkCreateExerciseSchema }), ExerciseController.bulkCreate);
router.post('/', validate({ body: createExerciseSchema }), ExerciseController.create);
router.get('/', validate({ query: exerciseQuerySchema }), ExerciseController.getAll);
router.delete('/by-workout/:workoutId', validate({ params: workoutIdParamsSchema }), ExerciseController.deleteByWorkout); // Mount before :id to prevent conflict
router.get('/:id', validate({ params: idParamsSchema }), ExerciseController.getById);
router.patch('/:id', validate({ params: idParamsSchema, body: updateExerciseSchema }), ExerciseController.update);
router.delete('/:id', validate({ params: idParamsSchema }), ExerciseController.delete);

export default router;
