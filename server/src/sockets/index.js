const { Server } = require('socket.io');
const { verifyToken } = require('../middleware/auth');
const Driver = require('../models/Driver');

let io = null;

function getIO() {
  return io;
}

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || '*' },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication token required'));
    try {
      socket.user = verifyToken(token);
      next();
    } catch (_err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.user;
    socket.join(`user:${id}`);
    if (role === 'driver') socket.join('drivers');

    socket.on('ride:join', (rideId) => {
      if (rideId) socket.join(`ride:${rideId}`);
    });

    socket.on('ride:leave', (rideId) => {
      if (rideId) socket.leave(`ride:${rideId}`);
    });

    socket.on('driver:location', async ({ lat, lng, rideId }) => {
      if (role !== 'driver' || typeof lat !== 'number' || typeof lng !== 'number') return;
      try {
        await Driver.findOneAndUpdate(
          { user: id },
          { location: { type: 'Point', coordinates: [lng, lat], updatedAt: new Date() } }
        );
      } catch (err) {
        console.error('driver location update failed', err.message);
      }
      if (rideId) {
        io.to(`ride:${rideId}`).emit('driver:location', { driverId: id, lat, lng });
      }
    });

    socket.on('rider:location', ({ lat, lng, rideId }) => {
      if (typeof lat !== 'number' || typeof lng !== 'number' || !rideId) return;
      io.to(`ride:${rideId}`).emit('rider:location', { riderId: id, lat, lng });
    });

    socket.on('chat:message', ({ rideId, text }) => {
      if (!rideId || !text) return;
      io.to(`ride:${rideId}`).emit('chat:message', {
        from: id,
        text: String(text).slice(0, 500),
        sentAt: new Date().toISOString(),
      });
    });

    socket.on('disconnect', async () => {
      if (role === 'driver') {
        try {
          await Driver.findOneAndUpdate({ user: id }, { isOnline: false, isAvailable: false });
        } catch (err) {
          console.error('driver offline update failed', err.message);
        }
      }
    });
  });

  return io;
}

module.exports = { initSocket, getIO };
