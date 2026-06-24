import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IExercise extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  workoutId: Types.ObjectId;
  name: string;
  weight: number;
  reps: number;
  sets: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const exerciseSchema = new Schema<IExercise>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workoutId: {
      type: Schema.Types.ObjectId,
      ref: 'Workout',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    reps: {
      type: Number,
      required: true,
    },
    sets: {
      type: Number,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

exerciseSchema.index({ workoutId: 1, createdAt: -1 });
exerciseSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

exerciseSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    ret.user_id = ret.userId ? ret.userId.toString() : undefined;
    ret.workout_id = ret.workoutId ? ret.workoutId.toString() : undefined;
    ret.created_at = ret.createdAt;
    delete ret._id;
    delete ret.userId;
    delete ret.workoutId;
    delete ret.isDeleted;
    delete ret.deletedAt;
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

exerciseSchema.pre(/^find/, function (this: any) {
  this.where({ isDeleted: { $ne: true } });
});

export const Exercise = mongoose.model<IExercise>('Exercise', exerciseSchema);
