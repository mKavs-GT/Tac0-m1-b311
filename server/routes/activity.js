const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { verifyToken } = require('./auth');

// ─── GET /api/activity ────────────────────────────────────────────────────────
// Merged activity feed: AttendanceLogs (clock in/out) + WorkLogs (quick logs)
// Sorted newest-first, max 50 entries
router.get('/', verifyToken, async (req, res) => {
  try {
    const [attendanceLogs, workLogs] = await Promise.all([
      prisma.attendanceLog.findMany({
        orderBy: { time: 'desc' },
        take: 30,
        include: {
          user: { select: { id: true, name: true, avatar: true, role: true } }
        }
      }),
      prisma.workLog.findMany({
        orderBy: { loggedAt: 'desc' },
        take: 30,
        include: {
          user: { select: { id: true, name: true, avatar: true, role: true } },
          project: { select: { id: true, name: true } }
        }
      })
    ]);

    const attendanceEntries = attendanceLogs.map(log => ({
      id: `att_${log.id}`,
      type: log.type, // 'CLOCK_IN' | 'CLOCK_OUT'
      user: log.user,
      timestamp: log.time,
      description: log.type === 'CLOCK_IN' ? 'Clocked in' : 'Clocked out',
      project: null,
      minutes: null
    }));

    const workEntries = workLogs.map(log => ({
      id: `wl_${log.id}`,
      type: 'WORK_LOG',
      user: log.user,
      timestamp: log.loggedAt,
      description: log.description,
      project: log.project,
      minutes: log.minutes
    }));

    const merged = [...attendanceEntries, ...workEntries]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50);

    res.json(merged);
  } catch (err) {
    console.error('Activity feed error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
