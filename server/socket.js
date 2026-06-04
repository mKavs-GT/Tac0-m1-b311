const { Server } = require('socket.io');

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // For development
      methods: ['GET', 'POST']
    }
  });

  const staffNamespace = io.of('/staff');

  staffNamespace.on('connection', (socket) => {
    console.log('User connected to /staff', socket.id);

    // When a user logs in or changes status
    socket.on('status_update', (data) => {
      socket.broadcast.emit('team_status_update', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected from /staff', socket.id);
    });
  });

  return io;
};

module.exports = setupSocket;
