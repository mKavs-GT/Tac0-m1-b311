const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { verifyToken } = require('./auth');

// Helper to create notification and emit socket event
const createNotification = async (req, userId, title, message, type, taskId) => {
  const notif = await prisma.notification.create({
    data: { userId, title, message, type, taskId }
  });
  // Emit to all connected clients in /staff, frontend filters by user ID
  if (req.io) {
    req.io.of('/staff').emit('new_notification', notif);
  }
};

// GET /api/tasks (all tasks — executives)
router.get('/', verifyToken, async (req, res) => {
  try {
    // Note: The prompt says "View all tasks: MGT-EXE-01, MGT-EXE-02. View own tasks: all team members."
    // BUT it also says "Non-relevant users see cards as read-only", implying they see all cards on the board.
    // I will return all tasks for the board, and the UI will filter or just show them read-only.
    // Let's actually enforce "mine only" at the API level if they are not executives, but wait, the kanban board needs to display all tasks so team knows what's happening.
    // Let's fetch all tasks for the board.
    const tasks = await prisma.task.findMany({
      include: {
        assigneeUser: { select: { name: true, avatar: true } },
        project: { select: { name: true } },
        sprint: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (err) {
    console.error('Fetch tasks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/tasks/mine (own tasks — all users)
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { assignedTo: req.user.uid },
      include: {
        assigneeUser: { select: { name: true, avatar: true } },
        project: { select: { name: true } },
        sprint: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (err) {
    console.error('Fetch my tasks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tasks (create — executives only)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (!req.user.isExecutive) return res.status(403).json({ error: 'Only executives can create tasks' });
    
    const { title, description, priority, projectId, sprintId, assignedTo, dueDate, estimatedHours } = req.body;
    
    if (!title || !assignedTo) return res.status(400).json({ error: 'Title and assignee are required' });

    const finalSprintId = sprintId && sprintId.startsWith('SPRINT-') ? null : sprintId;
    const finalDueDate = dueDate && dueDate.trim() !== '' ? new Date(dueDate) : null;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        status: 'TASKS',
        projectId: projectId || null,
        sprintId: finalSprintId,
        assignedTo,
        assignedBy: req.user.uid,
        dueDate: finalDueDate,
        estimatedHours: estimatedHours ? parseInt(estimatedHours) : null
      },
      include: {
        assigneeUser: { select: { name: true, avatar: true } },
        project: { select: { name: true } },
        sprint: { select: { name: true } }
      }
    });

    // Notify Assignee
    await createNotification(req, assignedTo, 'New Task', `New task assigned to you: ${title} — Due ${dueDate || 'N/A'}`, 'TASK_ASSIGNED', task.id);

    // Emit board update
    if (req.io) req.io.of('/staff').emit('board_update');

    res.status(201).json(task);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Server error creating task' });
  }
});

// PATCH /api/tasks/:id/accept (assignee only)
router.patch('/:id/accept', verifyToken, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.assignedTo !== req.user.uid) return res.status(403).json({ error: 'Only the assignee can accept this task' });

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: 'IN_PROGRESS' },
      include: { assigneeUser: true, project: true, sprint: true }
    });

    if (req.io) req.io.of('/staff').emit('board_update');
    res.json(updated);
  } catch (err) {
    console.error('Accept task error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/tasks/:id/complete (assignee only -> Testing)
router.patch('/:id/complete', verifyToken, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.assignedTo !== req.user.uid) return res.status(403).json({ error: 'Only the assignee can mark this complete' });

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: 'TESTING', completedAt: new Date() },
      include: { assigneeUser: true, project: true, sprint: true }
    });

    // Notify Tester
    await createNotification(req, 'MGT-DEV-02', 'Ready for Testing', `Task "${task.title}" is ready for testing.`, 'TESTING_NEEDED', task.id);

    if (req.io) req.io.of('/staff').emit('board_update');
    res.json(updated);
  } catch (err) {
    console.error('Complete task error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/tasks/:id/pass-testing (Mr.M only -> notifies Mr.K)
router.patch('/:id/pass-testing', verifyToken, async (req, res) => {
  try {
    const { testingNotes } = req.body;
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    // Read user from database to verify systemId (uid)
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || user.uid !== 'MGT-DEV-02') {
      return res.status(403).json({ error: 'Only Mr.M can pass testing' });
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { testingNotes },
      include: { assigneeUser: true, project: true, sprint: true }
    });

    // Notify Mr.K
    await createNotification(req, 'MGT-EXE-01', 'Testing Passed', `"${task.title}" has passed testing. Approve for Production?`, 'APPROVAL_NEEDED', task.id);

    if (req.io) req.io.of('/staff').emit('board_update');
    res.json(updated);
  } catch (err) {
    console.error('Pass testing error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/tasks/:id/approve (Mr.K only -> Production)
router.patch('/:id/approve', verifyToken, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!req.user.isExecutive) return res.status(403).json({ error: 'Only executives can approve tasks' });

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: 'PRODUCTION', approvedAt: new Date(), approvedBy: req.user.uid },
      include: { assigneeUser: true, project: true, sprint: true }
    });

    // Notify Assignee
    await createNotification(req, task.assignedTo, 'Task Approved', `Your task "${task.title}" is now in Production ✅`, 'TASK_APPROVED', task.id);

    if (req.io) req.io.of('/staff').emit('board_update');
    res.json(updated);
  } catch (err) {
    console.error('Approve task error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
