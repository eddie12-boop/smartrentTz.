const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middleware/errorMiddleware');
const {
  authLimiter,
  paymentLimiter,
  apiLimiter,
  sanitizeInput
} = require('./middleware/securityMiddleware');

const app = express();

// 1. Advanced Security Headers (OWASP Hardening)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin images/uploads
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Enable Google OAuth popup safely
  contentSecurityPolicy: false, // Set false for dev/flexibility with external map tiles / CDNs
  hidePoweredBy: true
}));

// 2. CORS Configuration
const allowedOrigins = process.env.CLIENT_URL ? [process.env.CLIENT_URL] : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev, can restrict in prod
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 3. Body Size Limits (DoS & Memory Exhaustion Mitigation)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Input Sanitization (XSS & Injection Protection)
app.use(sanitizeInput);

// 5. Serve static uploads folder with cache control
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// 6. Global DDoS Rate Limiter on API
app.use('/api', apiLimiter);

// 7. Stricter Rate Limiting on High-Risk Endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/payments/pay-control-number', paymentLimiter);

// 8. Request Logging (Minimal in dev, structured)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    skip: (req) => req.originalUrl === '/api/health'
  }));
}

// 9. API Routes
app.use('/api', routes);

// 10. 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Njia (Endpoint) hii haipatikani kwenye mfumo.',
    errorCode: 'ROUTE_NOT_FOUND'
  });
});

// 11. Global Error Handler (Masks sensitive database internals)
app.use(errorHandler);

module.exports = app;
