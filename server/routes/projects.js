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
    const formattedProjects = projects.map(p => {
      let allSprints = [...p.sprints];
      
      // If there are tasks without a sprint, group them into a default sprint
      const orphanTasks = p.tasks.filter(t => !t.sprintId);
      if (orphanTasks.length > 0) {
        allSprints.push({
          id: `SPRINT-${p.id}-default`,
          name: 'Active Sprint',
          tasks: orphanTasks
        });
      }

      if (allSprints.length === 0) {
        allSprints.push({ id: `SPRINT-${p.id}-1`, name: 'Active Sprint', tasks: [] });
      }

      return { ...p, sprints: allSprints };
    });

    res.json(formattedProjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
