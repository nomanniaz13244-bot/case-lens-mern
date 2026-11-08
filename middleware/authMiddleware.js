const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { DEMO_BYPASS, buildDemoUser } = require('../config/demoBypass');

const protect = async (req, res, next) => {
  // ⚠️ DEMO BYPASS: accept ANY bearer token and attach the demo identity.
  // No DB lookup, no JWT verification — the UI must work with the database down.
  if (DEMO_BYPASS) {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      req.user = buildDemoUser();
      return next();
    }
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided (Demo Bypass)',
    });
  }

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from DB and attach to req (excluding password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists',
        });
      }

      return next();
    } catch (error) {
      console.error('Auth Middleware Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }
};

// Optional admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required',
    });
  }
};

module.exports = { protect, admin };
