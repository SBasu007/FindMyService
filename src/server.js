import app from './app.js';
import { config } from './config/env.config.js';
import { ensureBusinessSchema, testDbConnection } from './config/db.js';

const PORT = config.port;

const startServer = async () => {
  // Test Neon Database connection
  await testDbConnection();
  await ensureBusinessSchema();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running in ${config.nodeEnv} mode on http://localhost:${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
  });
};

startServer();
