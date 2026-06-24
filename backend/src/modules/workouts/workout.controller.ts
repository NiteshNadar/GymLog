import { Request, Response, NextFunction } from 'express';
import { Workout } from './workout.model.js';
import { Exercise } from '../exercises/exercise.model.js';
import { assertOwnership } from '../../utils/ownershipCheck.js';

export class WorkoutController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, createdAt, endedAt } = req.body;
      const workout = new Workout({
        userId: req.user!._id,
        name,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        endedAt: endedAt ? new Date(endedAt) : null,
      });

      await workout.save();

      res.status(201).json({
        success: true,
        data: workout,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ended, limit, page, search } = req.query;
      const query: any = {
        userId: req.user!._id,
      };

      if (search) {
        query.$text = { $search: search as string };
      }

      if (ended === 'true') {
        query.endedAt = { $ne: null };
      } else if (ended === 'false') {
        query.endedAt = null;
      }

      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Number(limit) || 10);
      const skip = (pageNum - 1) * limitNum;

      const [workouts, total] = await Promise.all([
        Workout.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        Workout.countDocuments(query),
      ]);
      
      const workoutIds = workouts.map((w) => w._id);
      const exercises = await Exercise.find({
        workoutId: { $in: workoutIds },
        userId: req.user!._id,
      }).sort({ createdAt: 1 });

      const workoutsWithExercises = workouts.map((workout) => {
        const workoutJson = workout.toJSON() as any;
        workoutJson.exercises = exercises
          .filter((e) => e.workoutId.toString() === workout._id.toString())
          .map((e) => e.toJSON());
        return workoutJson;
      });

      res.status(200).json({
        success: true,
        data: workoutsWithExercises,
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
      const workout = await assertOwnership(Workout, req.params.id as string, req.user!._id.toString());
      
      const exercises = await Exercise.find({
        workoutId: workout._id,
        userId: req.user!._id,
      }).sort({ createdAt: 1 });

      const workoutJson = workout.toJSON() as any;
      workoutJson.exercises = exercises.map((e) => e.toJSON());

      res.status(200).json({
        success: true,
        data: workoutJson,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workout = await assertOwnership(Workout, req.params.id as string, req.user!._id.toString());
      
      const { name, endedAt } = req.body;
      if (name !== undefined) workout.name = name;
      if (endedAt !== undefined) workout.endedAt = endedAt ? new Date(endedAt) : null;

      await workout.save();

      res.status(200).json({
        success: true,
        data: workout,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workout = await assertOwnership(Workout, req.params.id as string, req.user!._id.toString());
      
      workout.isDeleted = true;
      workout.deletedAt = new Date();
      await workout.save();

      // We don't delete exercises here to maintain a true soft delete. 
      // If the workout is ever restored, the exercises will still be intact.

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async clearAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await Workout.updateMany(
        { userId: req.user!._id, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      );

      await Exercise.deleteMany({ userId: req.user!._id });

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}
