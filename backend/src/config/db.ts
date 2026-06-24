import mongoose from 'mongoose';
import dns from 'node:dns';
import { env } from './env.js';

// Override DNS servers to use Google and Cloudflare public DNS.
// This resolves the common 'querySrv ECONNREFUSED' error with MongoDB Atlas on some Windows networks/Node versions.
dns.setServers(['8.8.8.8', '1.1.1.1']);

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('🔌 MongoDB disconnected');
}
