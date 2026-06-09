const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get recent activity logs (admin only)
router.get('/', async (req, res) => {
    try {
        const logs = await prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                user: {
                    select: { name: true, email: true, avatar: true }
                }
            }
        });
        res.json(logs);
    } catch (err) {
        console.error('Error fetching activity logs:', err);
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
});

// Note: The system will automatically create activity logs internally, 
// so we do not expose a public POST endpoint for it as requested.

module.exports = router;
