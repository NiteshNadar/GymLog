import serverless from 'serverless-http';
import app from '../../backend/src/app.js';
import { connectDB } from '../../backend/src/config/db.js';

// Vercel/Netlify Serverless Function entry point
export const handler = async (event: any, context: any) => {
  // Ensure the database is connected before processing the request.
  // The connection logic in db.ts is cached, so it won't reconnect on every request.
  await connectDB();
  
  // Create the serverless handler with the correct base path for Netlify Functions
  const serverlessHandler = serverless(app, {
    basePath: '/.netlify/functions/api'
  });
  
  // Pass the request to the Express application
  return serverlessHandler(event, context);
};
