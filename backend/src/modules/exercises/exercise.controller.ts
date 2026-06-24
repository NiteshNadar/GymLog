import { Request, Response, NextFunction } from 'express';
import { Exercise } from './exercise.model.js';
import { Workout } from '../workouts/workout.model.js';
import { assertOwnership } from '../../utils/ownershipCheck.js';
import { Types } from 'mongoose';

export class ExerciseController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workout_id, name, weight, reps, sets } = req.body;
      
      // Assert that the workout belongs to this user
      await assertOwnership(Workout, workout_id as string, req.user!._id.toString());

      const exercise = new Exercise({
        userId: req.user!._id,
        workoutId: new Types.ObjectId(workout_id as string),
        name,
        weight,
        reps,
        sets,
      });

      await exercise.save();

      res.status(201).json({
        success: true,
        data: exercise,
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exercisesData = req.body; // Array of exercises

      // Extract unique workout IDs
      const workoutIds = [...new Set(exercisesData.map((e: any) => e.workout_id))];

      // Verify ownership for all unique workout IDs
      for (const workoutId of workoutIds) {
        await assertOwnership(Workout, workoutId as string, req.user!._id.toString());
      }

      const exercisesToInsert = exercisesData.map((e: any) => ({
        userId: req.user!._id,
        workoutId: new Types.ObjectId(e.workout_id),
        name: e.name,
        weight: e.weight,
        reps: e.reps,
        sets: e.sets,
      }));

      const inserted = await Exercise.insertMany(exercisesToInsert);

      res.status(201).json({
        success: true,
        data: inserted,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workout_id, suggestions, limit, page } = req.query;
      const query: any = { userId: req.user!._id };

      if (workout_id) {
        query.workoutId = new Types.ObjectId(workout_id as string);
      }

      if (suggestions === 'true') {
        const exercises = await Exercise.find(query).sort({ createdAt: -1 }).select('name').limit(50);
        res.status(200).json({
          success: true,
          data: exercises,
        });
        return;
      }

      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Number(limit) || 20);
      const skip = (pageNum - 1) * limitNum;

      const [exercises, total] = await Promise.all([
        Exercise.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        Exercise.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        data: exercises,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exercise = await assertOwnership(Exercise, req.params.id as string, req.user!._id.toString());
      res.status(200).json({
        success: true,
        data: exercise,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exercise = await assertOwnership(Exercise, req.params.id as string, req.user!._id.toString());

      const { name, weight, reps, sets } = req.body;
      if (name !== undefined) exercise.name = name;
      if (weight !== undefined) exercise.weight = weight;
      if (reps !== undefined) exercise.reps = reps;
      if (sets !== undefined) exercise.sets = sets;

      await exercise.save();

      res.status(200).json({
        success: true,
        data: exercise,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await assertOwnership(Exercise, req.params.id as string, req.user!._id.toString());
      await Exercise.findByIdAndUpdate(req.params.id, {
        isDeleted: true,
        deletedAt: new Date(),
      });

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteByWorkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workoutId } = req.params;
      
      // Verify workout ownership first
      await assertOwnership(Workout, workoutId as string, req.user!._id.toString());

      await Exercise.deleteMany({ workoutId: new Types.ObjectId(workoutId as string), userId: req.user!._id });

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}
