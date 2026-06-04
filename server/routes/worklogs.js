const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { verifyToken } = require('./auth');

// ─── POST /api/worklogs ───────────────────────────────────────────────────────
// Save a quick work log entry
router.post('/', verifyToken, async (req, res) => {
  try {
    const { description, projectId, minutes } = req.body;
    if (!description || !minutes) {
      return res.status(400).json({ error: 'description and minutes are required' });
    }
    const log = await prisma.workLog.create({
      data: {
        userId: req.user.userId,
        projectId: projectId || null,
        description,
        minutes: parseInt(minutes, 10)
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
        project: { select: { id: true, name: true } }
      }
    });
    res.status(201).json({ success: true, log });
  } catch (err) {
    console.error('WorkLog create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/worklogs ────────────────────────────────────────────────────────
// Fetch recent work logs for the current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const where = req.user.isExecutive ? {} : { userId: req.user.userId };
    const logs = await prisma.workLog.findMany({
      where,
      orderBy: { loggedAt: 'desc' },
      take: 20,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } }
      }
    });
    res.json(logs);
  } catch (err) {
    console.error('WorkLog fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
