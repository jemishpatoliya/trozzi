const mongoose = require('mongoose');
const { NotificationModel } = require('../models/notification');

function roomForUser(userId) {
  return userId ? `user:${String(userId)}` : null;
}

async function createNotification({
  userId,
  title,
  message,
  type,
  io,
  emitToAdmin = false,
}) {
  const doc = await NotificationModel.create({
    userId: userId ? new mongoose.Types.ObjectId(String(userId)) : null,
    title: String(title || '').trim(),
    message: String(message || '').trim(),
    type: String(type || '').trim(),
    isRead: false,
  });

  const payload = {
    id: String(doc._id),
    userId: doc.userId ? String(doc.userId) : null,
    title: doc.title,
    message: doc.message,
    type: doc.type,
    isRead: doc.isRead,
    createdAt: doc.createdAt,
  };

  if (io) {
    if (emitToAdmin) io.to('admin').emit('notification:new', payload);

    const userRoom = roomForUser(userId);
    if (userRoom) {
      io.to(userRoom).emit('notification:new', payload);
      io.to(`user_${String(userId)}`).emit('notification:new', payload);
    }
  }

  return payload;
}

async function createAdminNotification({ title, message, type, io }) {
  return createNotification({
    userId: null,
    title,
    message,
    type: `admin_${String(type || '').trim()}`,
    io,
    emitToAdmin: true,
  });
}

module.exports = {
  createNotification,
  createAdminNotification,
};
