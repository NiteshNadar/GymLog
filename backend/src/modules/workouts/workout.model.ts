import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWorkout extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  createdAt: Date;
  endedAt: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
}

const workoutSchema = new Schema<IWorkout>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

workoutSchema.index({ userId: 1, createdAt: -1 });
workoutSchema.index({ name: 'text', notes: 'text' });
workoutSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

workoutSchema.pre(/^find/, function (this: any) {
  this.where({ isDeleted: { $ne: true } });
});

workoutSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    ret.user_id = ret.userId ? ret.userId.toString() : undefined;
    ret.created_at = ret.createdAt;
    ret.ended_at = ret.endedAt;
    delete ret._id;
    delete ret.userId;
    delete ret.createdAt;
    delete ret.endedAt;
    delete ret.isDeleted;
    delete ret.deletedAt;
    delete ret.__v;
    return ret;
  },
});

export const Workout = mongoose.model<IWorkout>('Workout', workoutSchema);
