const rateLimit = require('express-rate-limit');

// 1. Strict Rate Limiter for Authentication (Brute-Force & Credential Stuffing Prevention)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 attempts per IP per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Majaribio mengi ya kuingia yamefanyika. Tafadhali subiri dakika 15 kabla ya kujaribu tena.',
    errorCode: 'TOO_MANY_REQUESTS'
  }
});

// 2. Strict Rate Limiter for GePG Payments (Prevent automated Control Number probing)
const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // Max 30 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Majaribio mengi ya malipo yamefanyika. Tafadhali subiri kidogo.',
    errorCode: 'PAYMENT_RATE_LIMITED'
  }
});

// 3. Global API Rate Limiter (DDoS Mitigation)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // Max 300 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Maombi mengi yamepokelewa. Mfumo unalinda usalama wako.',
    errorCode: 'API_RATE_LIMITED'
  }
});

// 4. Input Sanitization Middleware (XSS & Injection Protection)
const sanitizeInput = (req, res, next) => {
  const sanitize = (val) => {
    if (typeof val === 'string') {
      // Remove dangerous script tags and event handlers
      return val
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/onerror=/gi, '')
        .replace(/onload=/gi, '')
        .replace(/onclick=/gi, '')
        .trim();
    }
    if (typeof val === 'object' && val !== null) {
      for (const key in val) {
        val[key] = sanitize(val[key]);
      }
    }
    return val;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

module.exports = {
  authLimiter,
  paymentLimiter,
  apiLimiter,
  sanitizeInput
};
