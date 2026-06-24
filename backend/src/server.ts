import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

async function startServer() {
  // 1. Connect to Database
  await connectDB();

  // 2. Start Listening
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server listening in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  // Graceful Shutdown helper
  const shutdown = async (signal: string) => {
    console.log(`\n📶 Received ${signal}. Shutting down gracefully...`);
    
    server.close(async () => {
      console.log('🏁 Express server closed.');
      await disconnectDB();
      process.exit(0);
    });

    // Timeout shutdown after 10 seconds
    setTimeout(() => {
      console.error('⚠️ Forcefully shutting down because graceful shutdown timed out.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
  console.error('🔥 Failed to start server:', error);
  process.exit(1);
});
