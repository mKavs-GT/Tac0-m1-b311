const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { verifyToken } = require('./auth');

// GET /api/notifications (current user's notifications)
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.uid },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Server error fetching notifications' });
  }
});

// PATCH /api/notifications/:id/read (mark as read)
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return res.status(404).json({ error: 'Not found' });
    if (notification.userId !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
    res.json(updated);
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ error: 'Server error updating notification' });
  }
});

module.exports = router;
