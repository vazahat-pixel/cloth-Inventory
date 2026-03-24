const Notification = require('../../models/notification.model');
const { getIO } = require('../../config/socket');

/**
 * Create and send real-time notification
 */
const sendNotification = async (notificationData) => {
    const notification = new Notification(notificationData);
    await notification.save();

    // Emit via Socket.io
    const io = getIO();
    if (io) {
        if (notificationData.userId) {
            // Target specific user
            io.to(notificationData.userId.toString()).emit('notification', notification);
        } else {
            // Broadcast to all
            io.emit('notification', notification);
        }
    }

    return notification;
};

/**
 * Get notifications for a user
 */
const getNotifications = async (userId, limit = 20) => {
    const filter = {};
    if (userId) filter.userId = userId;
    
    return await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
};

/**
 * Mark notification as read
 */
const markAsRead = async (id, userId) => {
    const filter = { _id: id };
    if (userId) filter.userId = userId;

    const notification = await Notification.findOneAndUpdate(
        filter,
        { isRead: true },
        { new: true }
    );
    return notification;
};

/**
 * Mark all as read for a user
 */
const markAllAsRead = async (userId) => {
    return await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
    );
};

module.exports = {
    sendNotification,
    getNotifications,
    markAsRead,
    markAllAsRead
};
