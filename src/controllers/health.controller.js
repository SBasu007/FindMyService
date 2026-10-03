import { ApiResponse } from '../utils/ApiResponse.js';

export const getHealthStatus = (req, res) => {
  const healthData = {
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(new ApiResponse(200, healthData, 'Server is running smoothly'));
};
