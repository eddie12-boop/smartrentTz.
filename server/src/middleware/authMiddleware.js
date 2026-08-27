const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  let token = req.headers.authorization;

  if (token && token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      errorCode: 'AUTH_REQUIRED'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token is invalid or expired',
      errorCode: 'INVALID_TOKEN'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'User role is not authorized to access this route',
        errorCode: 'FORBIDDEN'
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
