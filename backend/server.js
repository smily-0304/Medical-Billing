require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const invoiceRoutes = require('./routes/invoiceRoutes');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Medical Billing System API' });
  });

  app.use('/api/invoices', invoiceRoutes);

  return app;
}

function startServer(app, requestedPort = process.env.PORT || 5002, host = process.env.HOST || '127.0.0.1') {
  const preferredPort = Number(requestedPort);
  const initialPort = Number.isInteger(preferredPort) && preferredPort > 0 ? preferredPort : 5002;

  return new Promise((resolve, reject) => {
    const tryListen = (portToTry) => {
      const server = app.listen(portToTry, host, () => {
        const address = server.address();
        const actualPort = typeof address === 'object' && address ? address.port : portToTry;
        console.log(`Server running on port ${actualPort}`);
        resolve(server);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          const nextPort = portToTry + 1;
          console.warn(`Port ${portToTry} is already in use. Trying ${nextPort}.`);
          tryListen(nextPort);
        } else {
          reject(err);
        }
      });
    };

    tryListen(initialPort);
  });
}

async function connectAndStart() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medical_billing');
    console.log('MongoDB connected');
    await startServer(createApp());
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  connectAndStart();
}

module.exports = {
  createApp,
  startServer,
  connectAndStart,
};
