const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Resolve the backend env file from this source file so startup works from any cwd.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('./config/db');
const seedData = require('./utils/seedData');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Body Parser & CORS Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'AutoFlow Smart Vehicle Service Platform API',
    timestamp: new Date(),
  });
});

// Mount Application Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/service-jobs', require('./routes/serviceJobRoutes'));
app.use('/api/inspections', require('./routes/inspectionRoutes'));
app.use('/api/estimates', require('./routes/estimateRoutes'));
app.use('/api/parts', require('./routes/partRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/audit-logs', require('./routes/auditRoutes'));

// Serve frontend build in production if available
const fs = require('fs');
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedData();
  
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`AutoFlow API Server running on port ${PORT}`);
    console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
};

startServer();
