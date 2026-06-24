import { Request, Response, NextFunction } from 'express';
import { User } from './user.model.js';
import { Workout } from '../workouts/workout.model.js';
import { Exercise } from '../exercises/exercise.model.js';

export class UserController {
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        });
        return;
      }

      const user = await User.findById(req.user._id).select('-passwordHash -refreshTokens');
      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        });
        return;
      }

      const { confirmationText } = req.body;
      if (confirmationText !== 'DELETE MY ACCOUNT') {
        res.status(400).json({
          success: false,
          error: { code: 'CONFIRM_TEXT_MISMATCH', message: 'Confirmation text must be exactly "DELETE MY ACCOUNT"' },
        });
        return;
      }

      await User.findByIdAndUpdate(req.user._id, {
        isDeleted: true,
        deletedAt: new Date(),
        refreshTokens: [], // Revoke all sessions
      });

      res.status(200).json({
        success: true,
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        });
        return;
      }

      const [user, workouts, exercises] = await Promise.all([
        User.findById(req.user._id),
        Workout.find({ userId: req.user._id, isDeleted: { $ne: true } }),
        Exercise.find({ userId: req.user._id, isDeleted: { $ne: true } }),
      ]);

      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        });
        return;
      }

      const data = {
        user: user.toJSON(),
        workouts: workouts.map((w) => w.toJSON()),
        exercises: exercises.map((e) => e.toJSON()),
      };

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
