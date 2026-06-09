const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get broadcasts for a user (includes read state)
router.get('/', async (req, res) => {
    try {
        const { userId, role } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        // Fetch broadcasts that are global or target this user's role
        const broadcasts = await prisma.broadcast.findMany({
            where: {
                OR: [
                    { targetRole: null },
                    { targetRole: role }
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: { name: true, avatar: true, email: true }
                },
                reads: {
                    where: { userId }
                }
            }
        });

        // Format to include isRead boolean
        const formatted = broadcasts.map(b => ({
            ...b,
            isRead: b.reads.length > 0
        }));

        res.json(formatted);
    } catch (err) {
        console.error('Error fetching broadcasts:', err);
        res.status(500).json({ error: 'Failed to fetch broadcasts' });
    }
});

// Mark broadcast as read
router.post('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        await prisma.broadcastRead.upsert({
            where: {
                broadcastId_userId: { broadcastId: id, userId }
            },
            update: {},
            create: {
                broadcastId: id,
                userId
            }
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Error marking broadcast read:', err);
        res.status(500).json({ error: 'Failed to mark broadcast as read' });
    }
});

// Create a new broadcast (Executive only)
router.post('/', async (req, res) => {
    try {
        const { title, message, sentBy, targetRole } = req.body;
        if (!title || !message || !sentBy) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const broadcast = await prisma.broadcast.create({
            data: {
                title,
                message,
                sentBy,
                targetRole: targetRole || null
            },
            include: {
                sender: { select: { name: true, avatar: true } }
            }
        });

        // Emit to websockets if available
        if (req.io) {
            req.io.of('/staff').emit('new_broadcast', broadcast);
        }

        res.status(201).json(broadcast);
    } catch (err) {
        console.error('Error creating broadcast:', err);
        res.status(500).json({ error: 'Failed to create broadcast' });
    }
});

module.exports = router;
