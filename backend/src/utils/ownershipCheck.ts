import { Model, Types } from 'mongoose';

export async function assertOwnership<T>(
  ModelClass: Model<T>,
  resourceId: string,
  userId: string
): Promise<T> {
  const doc = await ModelClass.findOne({
    _id: new Types.ObjectId(resourceId),
    userId: new Types.ObjectId(userId),
  });
  if (!doc) {
    // Always 404, never 403 — don't confirm the resource exists
    const err = new Error('Resource not found') as Error & { statusCode: number; code: string };
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return doc;
}
