const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { verifyToken } = require('./auth');

// ─── POST /api/admin-projects — Create a new project ─────────────────────────
router.post('/', verifyToken, async (req, res) => {
  if (!req.user.isExecutive && !req.user.isManager) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  try {
    const { name, description, client, status, startDate, endDate, members } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        client: client || null,
        status: status || 'Active',
        dueDate: endDate ? new Date(endDate) : null,
        members: members || []
      },
      include: {
        sprints: { include: { tasks: true } },
        tasks: true
      }
    });
    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        sprints: {
          include: {
            tasks: true
          }
        },
        tasks: true // Include orphaned tasks if any
      }
    });
    
    // Transform to expected frontend structure
      // Transform tasks into columns format expected by ProjectManager.jsx
      const formatSprint = (sprintObj) => {
        const columns = {
          tasks: [],
          inProgress: [],
          testing: [],
          production: []
        };
        (sprintObj.tasks || []).forEach(t => {
          // Default to 'tasks' if status is unknown
          const colKey = columns[t.status] ? t.status : 'tasks';
          columns[colKey].push({
            id: t.id,
            content: t.title,
            priority: t.priority?.toLowerCase() || 'medium',
            status: t.status,
            assignees: t.assigneeId ? [{ uid: t.assigneeId }] : [] // Basic assignee mapping
          });
        });
        
        // Calculate progress based on production tasks
        const total = Object.values(columns).reduce((acc, col) => acc + col.length, 0);
        const live = columns.production.length;
        const progress = total === 0 ? 0 : Math.round((live / total) * 100);

        return { ...sprintObj, _id: sprintObj.id, columns, progress };
      };

      let allSprints = p.sprints.map(formatSprint);
      
      // If there are tasks without a sprint, group them into a default sprint
      const orphanTasks = p.tasks.filter(t => !t.sprintId);
      if (orphanTasks.length > 0) {
        allSprints.push(formatSprint({
          id: `SPRINT-${p.id}-default`,
          name: 'Active Sprint',
          tasks: orphanTasks
        }));
      }

      if (allSprints.length === 0) {
        allSprints.push(formatSprint({ id: `SPRINT-${p.id}-1`, name: 'Active Sprint', tasks: [] }));
      }

      return { ...p, _id: p.id, sprints: allSprints };
    });

    res.json(formattedProjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PUT /api/admin-projects/:id — Update a project ───────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  if (!req.user.isExecutive && !req.user.isManager) return res.status(403).json({ error: 'Forbidden' });
  try {
    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE /api/admin-projects/:id — Delete a project ────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  if (!req.user.isExecutive) return res.status(403).json({ error: 'Forbidden' });
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/admin-projects/:id/sprints — Add a Sprint ──────────────────────
router.post('/:id/sprints', verifyToken, async (req, res) => {
  if (!req.user.isExecutive && !req.user.isManager) return res.status(403).json({ error: 'Forbidden' });
  try {
    const sprint = await prisma.sprint.create({
      data: {
        name: req.body.name || 'New Sprint',
        project: { connect: { id: req.params.id } },
        endDate: req.body.dueDate ? new Date(req.body.dueDate) : null
      }
    });
    res.json(sprint);
  } catch (err) {
    console.error('Create sprint error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/admin-projects/:id/sprints/:sprintId/tasks — Add Task ──────────
router.post('/:id/sprints/:sprintId/tasks', verifyToken, async (req, res) => {
  try {
    const task = await prisma.task.create({
      data: {
        title: req.body.content || 'New Task',
        priority: req.body.priority || 'Medium',
        status: req.body.status || 'Tasks', // Default column
        assigneeId: req.body.assignees && req.body.assignees[0] ? req.body.assignees[0] : null,
        project: { connect: { id: req.params.id } },
        sprint: { connect: { id: req.params.sprintId } }
      }
    });
    res.json(task);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PUT /api/admin-projects/:id/sprints/:sprintId/tasks/:taskId — Update Task 
router.put('/:id/sprints/:sprintId/tasks/:taskId', verifyToken, async (req, res) => {
  try {
    const task = await prisma.task.update({
      where: { id: req.params.taskId },
      data: {
        status: req.body.status,
        assigneeId: req.body.assigneeId
      }
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
