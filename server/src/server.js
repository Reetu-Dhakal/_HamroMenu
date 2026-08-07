import http from 'http';
import app from './app.js';
import config from './config/index.js';
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';

const start = async () => {
  await connectDB();
  const server = http.createServer(app);
  initSocket(server);
  server.listen(config.port, () => {
    console.log(`HamroMenu API running at http://localhost:${config.port}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});