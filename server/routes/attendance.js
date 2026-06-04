const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { verifyToken } = require('./auth');

// Helper: get today's date at midnight (local day boundary)
function getTodayMidnight() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

// Helper: get or create today's Attendance record for a user
// isExecutive: if true, always ensures isPresent = true (auto-approval)
async function getOrCreateAttendance(userId, isExecutive = false) {
  const today = getTodayMidnight();
  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: today } }
  });
  if (existing) {
    // If executive and not yet marked present, auto-approve
    if (isExecutive && !existing.isPresent) {
      return prisma.attendance.update({
        where: { id: existing.id },
        data: { isPresent: true, approvedBy: userId }
      });
    }
    return existing;
  }
  return prisma.attendance.create({
    data: { userId, date: today, isPresent: isExecutive ? true : false, approvedBy: isExecutive ? userId : null }
  });
}

// ─── GET /api/attendance/today ───────────────────────────────────────────────
// Returns today's attendance for ALL users (Mr.K only) or own record (others)
router.get('/today', verifyToken, async (req, res) => {
  try {
    const today = getTodayMidnight();
    if (req.user.isExecutive) {
      // Auto-approve Mr.K's own record first
      await getOrCreateAttendance(req.user.userId, true);

      // Mr.K sees everyone
      const records = await prisma.attendance.findMany({
        where: { date: today },
        include: { user: { select: { id: true, name: true, uid: true, avatar: true, role: true } } }
      });
      // Also include users with no record yet
      const allUsers = await prisma.user.findMany({ select: { id: true, name: true, uid: true, avatar: true, role: true } });
      const recordMap = {};
      records.forEach(r => { recordMap[r.userId] = r; });
      const result = allUsers.map(u => {
        const rec = recordMap[u.id] || {
          userId: u.id, date: today, isPresent: false,
          clockInTime: null, clockOutTime: null, totalDuration: 0, presenceStatus: null,
          user: u
        };
        // Executive's own record is always shown as approved
        if (u.id === req.user.userId) {
          rec.isPresent = true;
          rec._isSelf = true;
        }
        return rec;
      });
      return res.json(result);
    } else {
      const record = await getOrCreateAttendance(req.user.userId, false);
      return res.json([record]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/attendance/approve/:userId ────────────────────────────────────
// Mr.K marks a team member as Present for today (one-time daily)
router.post('/approve/:userId', verifyToken, async (req, res) => {
  if (!req.user.isExecutive) {
    return res.status(403).json({ error: 'Only executives can approve attendance' });
  }
  try {
    const today = getTodayMidnight();
    const record = await prisma.attendance.upsert({
      where: { userId_date: { userId: req.params.userId, date: today } },
      update: { isPresent: true, approvedBy: req.user.userId },
      create: { userId: req.params.userId, date: today, isPresent: true, approvedBy: req.user.userId }
    });
    res.json({ success: true, record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/attendance/revoke/:userId ─────────────────────────────────────
// Mr.K can revoke attendance approval
router.post('/revoke/:userId', verifyToken, async (req, res) => {
  if (!req.user.isExecutive) {
    return res.status(403).json({ error: 'Only executives can revoke attendance' });
  }
  try {
    const today = getTodayMidnight();
    const record = await prisma.attendance.upsert({
      where: { userId_date: { userId: req.params.userId, date: today } },
      update: { isPresent: false, approvedBy: null },
      create: { userId: req.params.userId, date: today, isPresent: false }
    });
    res.json({ success: true, record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/attendance/clock-in ───────────────────────────────────────────
// Clock in — executives are always allowed; others require isPresent = true
router.post('/clock-in', verifyToken, async (req, res) => {
  try {
    // Executives auto-approve themselves
    const attendance = await getOrCreateAttendance(req.user.userId, req.user.isExecutive);

    if (!attendance.isPresent) {
      return res.status(403).json({
        error: 'Attendance not approved for today. Please wait for Mr.K to mark you present.'
      });
    }

    const now = new Date();

    // Only record clockInTime on the VERY FIRST clock-in of the day.
    // On subsequent clock-ins, clockInTime stays unchanged so "First Login" never resets.
    // sessionStartTime tracks the current session for duration calculation.
    const updateData = {
      presenceStatus: 'clocked-in',
      clockOutTime: null,
      sessionStartTime: now,           // current session start (resets each clock-in)
      ...(attendance.clockInTime ? {} : { clockInTime: now }) // first-time only
    };

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: updateData
    });

    // Log the punch event
    await prisma.attendanceLog.create({
      data: {
        userId: req.user.userId,
        attendanceId: attendance.id,
        type: 'CLOCK_IN',
        time: now,
        status: 'clocked-in'
      }
    });

    res.json({
      success: true,
      clockInTime: updated.clockInTime,     // first login time (never changes)
      sessionStartTime: now,                 // current session start
      attendance: updated
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/attendance/clock-out ──────────────────────────────────────────
// Clock out — calculates session duration and adds to totalDuration
router.post('/clock-out', verifyToken, async (req, res) => {
  try {
    const attendance = await getOrCreateAttendance(req.user.userId);

    if (!attendance.isPresent) {
      return res.status(403).json({ error: 'Not marked present today.' });
    }
    if (!attendance.clockInTime) {
      return res.status(400).json({ error: 'No active clock-in found.' });
    }

    const now = new Date();
    // Use sessionStartTime for duration if available, fall back to clockInTime
    const sessionStart = attendance.sessionStartTime
      ? new Date(attendance.sessionStartTime)
      : new Date(attendance.clockInTime);
    const sessionSeconds = Math.floor((now - sessionStart) / 1000);
    const newTotal = (attendance.totalDuration || 0) + sessionSeconds;

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOutTime: now,
        totalDuration: newTotal,
        presenceStatus: 'clocked-out'
      }
    });

    await prisma.attendanceLog.create({
      data: {
        userId: req.user.userId,
        attendanceId: attendance.id,
        type: 'CLOCK_OUT',
        time: now,
        status: 'clocked-out'
      }
    });

    res.json({ success: true, clockOutTime: now, sessionSeconds, totalDuration: newTotal, attendance: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/attendance/history ─────────────────────────────────────────────
// Mr.K sees all logs; others see only their own
router.get('/history', verifyToken, async (req, res) => {
  try {
    const where = req.user.isExecutive ? {} : { userId: req.user.userId };
    const logs = await prisma.attendanceLog.findMany({
      where,
      orderBy: { time: 'desc' },
      take: 200,
      include: {
        user: { select: { name: true, uid: true, avatar: true, role: true } }
      }
    });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/attendance/stats ───────────────────────────────────────────────
// Own attendance stats (today total duration, monthly hours)
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const today = getTodayMidnight();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Ensure executive's own record is always auto-approved
    if (req.user.isExecutive) {
      await getOrCreateAttendance(req.user.userId, true);
    }

    const records = await prisma.attendance.findMany({
      where: { userId: req.user.userId, date: { gte: firstDayOfMonth } }
    });

    const todayRecord = records.find(r => r.date.getTime() === today.getTime());
    const monthlySeconds = records.reduce((sum, r) => sum + (r.totalDuration || 0), 0);

    // Count days marked present this month
    const daysPresent = records.filter(r => r.isPresent).length;

    // Count Mon–Fri working days from start of month to today (inclusive)
    let workingDays = 0;
    const cursor = new Date(firstDayOfMonth);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    while (cursor < tomorrow) {
      const d = cursor.getDay();
      if (d !== 0 && d !== 6) workingDays++;
      cursor.setDate(cursor.getDate() + 1);
    }

    // Executives are always marked present
    const isPresent = req.user.isExecutive ? true : (todayRecord?.isPresent || false);

    res.json({
      today: todayRecord || null,
      totalDurationToday: todayRecord?.totalDuration || 0,
      totalDurationMonth: monthlySeconds,
      isPresent,
      clockInTime: todayRecord?.clockInTime || null,
      sessionStartTime: todayRecord?.sessionStartTime || null,
      clockOutTime: todayRecord?.clockOutTime || null,
      presenceStatus: todayRecord?.presenceStatus || null,
      daysPresent,
      workingDays
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
