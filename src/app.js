import express from 'express';
import cors from 'cors';
import { config } from './config/env.config.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// Global Middlewares
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the API',
    status: 'Healthy',
  });
});

// API Routes
app.use('/api/v1', apiRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
