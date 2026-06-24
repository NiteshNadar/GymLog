import app from '../backend/src/app.js';
import { connectDB } from '../backend/src/config/db.js';

// Vercel Serverless Function entry point
export default async (req: any, res: any) => {
  // Ensure the database is connected before processing the request.
  // The connection logic in db.ts is cached, so it won't reconnect on every request.
  await connectDB();
  
  // Pass the request to the Express application
  return app(req, res);
};
