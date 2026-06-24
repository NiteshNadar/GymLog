import mongoose, { Schema, Document } from 'mongoose';

export interface ILoginAttempt extends Document {
  email: string;
  ip: string;
  createdAt: Date;
}

const loginAttemptSchema = new Schema<ILoginAttempt>({
  email: { type: String, required: true, index: true },
  ip: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// TTL index to automatically purge records after 15 minutes
loginAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15 * 60 });

export const LoginAttempt = mongoose.model<ILoginAttempt>('LoginAttempt', loginAttemptSchema);
