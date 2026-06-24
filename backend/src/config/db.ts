import mongoose from 'mongoose';
import dns from 'node:dns';
import { env } from './env.js';

// Override DNS servers to use Google and Cloudflare public DNS.
// This resolves the common 'querySrv ECONNREFUSED' error with MongoDB Atlas on some Windows networks/Node versions.
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Cache the Mongoose connection in a global variable for Serverless environments (like Vercel).
// This prevents exhausting the MongoDB connection pool as functions spin up and down.
let cached = (global as any).mongoose;
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB(): Promise<void> {
  if (cached.conn) {
    return; // Already connected
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(env.MONGODB_URI).then((mongoose) => {
      console.log('✅ MongoDB connected');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // Reset promise on failure so we can try again
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('🔌 MongoDB disconnected');
}
