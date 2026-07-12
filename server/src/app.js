const express = require('express');
const cors = require('cors');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

// Register API Routes here
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/allocations', require('./routes/allocationRoutes'));
app.use('/api/transfer-requests', require('./routes/transferRequestRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/asset-categories', require('./routes/assetCategoryRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/activity-logs', require('./routes/activityLogRoutes'));
app.use('/api', require('./routes/auditRoutes'));

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    if (statusCode >= 500) {
        console.error(err.stack);
    } else {
        console.warn(`[Client Error] ${statusCode}: ${err.message}`);
    }
    res.status(statusCode).json({
        status: err.status || 'error',
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

module.exports = app;
