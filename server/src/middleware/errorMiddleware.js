/**
 * Secure Global Error Handler
 * Prevents Information Disclosure (CWE-209 / OWASP A04)
 * Masks database internals, Prisma schema details and server stack traces in production/client responses.
 */
const errorHandler = (err, req, res, next) => {
  // Log detailed error server-side for internal diagnostics
  console.error(`[ERROR] ${new Date().toISOString()} ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);

  // Prisma or Database specific error handling
  let userMessage = err.message || 'Hitilafu ya ndani ya seva. Tafadhali jaribu tena.';
  let errorCode = err.errorCode || 'INTERNAL_ERROR';

  if (err.code === 'P2002') {
    // Unique constraint violation (e.g. email or phone already registered)
    statusCode = 400;
    userMessage = 'Taarifa hizi (barua pepe au nambari ya simu au NIDA) tayari zimeshasajiliwa.';
    errorCode = 'DUPLICATE_ENTRY';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    userMessage = 'Kumbukumbu iliyoombwa haijapatikana kwenye mfumo.';
    errorCode = 'NOT_FOUND';
  } else if (err.message && (err.message.includes('prisma') || err.message.includes('column') || err.message.includes('database'))) {
    // Mask raw SQL/Prisma details from being leaked to attackers
    userMessage = 'Hitilafu imetokea wakati wa kuchakata data. Tafadhali jaribu tena.';
    errorCode = 'DATABASE_ERROR';
  }

  res.status(statusCode).json({
    success: false,
    message: userMessage,
    errorCode: errorCode
  });
};

module.exports = errorHandler;
