const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getTodayMidnight() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

async function getOrCreateAttendance(userId, isExecutive = false) {
  const today = getTodayMidnight();
  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: today } }
  });
  if (existing) {
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

async function test() {
  try {
    const executive = await prisma.user.findFirst({ where: { isExecutive: true } });
    if (!executive) throw new Error('No executive found');

    const req = { user: { userId: executive.id, isExecutive: true } };
    const today = getTodayMidnight();

    if (req.user.isExecutive) {
      console.log('1. Auto-approving executive...');
      await getOrCreateAttendance(req.user.userId, true);
      
      console.log('2. Fetching records...');
      const records = await prisma.attendance.findMany({
        where: { date: today },
        include: { user: { select: { id: true, name: true, uid: true, avatar: true, role: true } } }
      });

      console.log('3. Fetching all users...');
      const allUsers = await prisma.user.findMany({ select: { id: true, name: true, uid: true, avatar: true, role: true } });

      console.log('4. Mapping...');
      const recordMap = {};
      records.forEach(r => { recordMap[r.userId] = r; });
      const result = allUsers.map(u => {
        const rec = recordMap[u.id] || {
          userId: u.id, date: today, isPresent: false,
          clockInTime: null, clockOutTime: null, totalDuration: 0, presenceStatus: null,
          user: u
        };
        if (u.id === req.user.userId) {
          rec.isPresent = true;
          rec._isSelf = true;
        }
        return rec;
      });

      console.log('SUCCESS! Result length:', result.length);
      console.log('Result type:', typeof result);
      console.log('Is Array?', Array.isArray(result));
    }
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
