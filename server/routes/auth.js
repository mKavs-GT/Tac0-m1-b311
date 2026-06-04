const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const admin = require('../firebase-admin');

// Middleware: verify Firebase ID token and attach DB user to req
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  const idToken = authHeader.split(' ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Try to find user by firebaseUid first
    let user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });

    // First-login fallback: link by email if firebaseUid not yet stored
    if (!user) {
      const userByEmail = await prisma.user.findUnique({ where: { email: decoded.email } });
      if (userByEmail) {
        user = await prisma.user.update({
          where: { email: decoded.email },
          data: { firebaseUid: decoded.uid }
        });
        console.log(`Linked Firebase UID ${decoded.uid} to user ${user.name}`);
      }
    }

    if (!user) return res.status(401).json({ message: 'User not found. Contact admin.' });

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      uid: user.uid,
      isExecutive: user.isExecutive,
      isManager: user.isManager
    };
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// POST /api/auth/verify — verify Firebase token and return full user profile
router.post('/verify', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password: _, ...userObj } = user;
    res.json({ agent: userObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = { router, verifyToken };
