const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { startOfDay, endOfDay } = require('date-fns');

// Get standup for today for a user
router.get('/today', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        const today = new Date();
        const start = startOfDay(today);
        const end = endOfDay(today);

        const standup = await prisma.standup.findFirst({
            where: {
                userId,
                date: {
                    gte: start,
                    lte: end
                }
            }
        });

        res.json(standup);
    } catch (err) {
        console.error('Error fetching standup:', err);
        res.status(500).json({ error: 'Failed to fetch standup' });
    }
});

// Submit standup
router.post('/', async (req, res) => {
    try {
        const { userId, yesterday, today, blockers } = req.body;
        if (!userId || !yesterday || !today) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const date = startOfDay(new Date());

        const standup = await prisma.standup.upsert({
            where: {
                userId_date: {
                    userId,
                    date
                }
            },
            update: {
                yesterday,
                today,
                blockers
            },
            create: {
                userId,
                date,
                yesterday,
                today,
                blockers
            }
        });

        res.status(201).json(standup);
    } catch (err) {
        console.error('Error submitting standup:', err);
        res.status(500).json({ error: 'Failed to submit standup' });
    }
});

module.exports = router;
