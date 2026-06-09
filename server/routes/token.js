const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get tokens for a user
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        const tokens = await prisma.token.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            include: {
                reviewer: { select: { name: true } }
            }
        });

        res.json(tokens);
    } catch (err) {
        console.error('Error fetching tokens:', err);
        res.status(500).json({ error: 'Failed to fetch tokens' });
    }
});

// Get all pending tokens (Admin/Executive only)
router.get('/pending', async (req, res) => {
    try {
        const tokens = await prisma.token.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, avatar: true } }
            }
        });

        res.json(tokens);
    } catch (err) {
        console.error('Error fetching pending tokens:', err);
        res.status(500).json({ error: 'Failed to fetch pending tokens' });
    }
});

// Submit a new token request
router.post('/', async (req, res) => {
    try {
        const { userId, type, date, reason, note } = req.body;
        if (!userId || !type || !date || !reason) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const token = await prisma.token.create({
            data: {
                userId,
                type,
                date: new Date(date),
                reason,
                note
            }
        });

        res.status(201).json(token);
    } catch (err) {
        console.error('Error submitting token:', err);
        res.status(500).json({ error: 'Failed to submit token' });
    }
});

// Review a token (Approve/Reject)
router.post('/:id/review', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reviewedBy, reviewNote } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const token = await prisma.token.update({
            where: { id },
            data: {
                status,
                reviewedBy,
                reviewNote
            }
        });

        res.json(token);
    } catch (err) {
        console.error('Error reviewing token:', err);
        res.status(500).json({ error: 'Failed to review token' });
    }
});

module.exports = router;
