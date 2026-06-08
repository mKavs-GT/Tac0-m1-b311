require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const setupSocket = require('./socket');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Setup WebSockets
const io = setupSocket(server);
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
const { router: authRouter } = require('./routes/auth');
app.use('/api/auth', authRouter);
const attendanceRouter = require('./routes/attendance');
app.use('/api/attendance', attendanceRouter);
app.use('/api/time-entries', attendanceRouter); // backward compat
app.use('/api/admin-projects', require('./routes/projects'));
app.use('/api/worklogs', require('./routes/worklogs'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/notifications', require('./routes/notifications'));
// app.use('/api/clients', require('./routes/clients'));
// app.use('/api/vault', require('./routes/vault'));
// app.use('/api/chat', require('./routes/chat'));

// Basic route
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
