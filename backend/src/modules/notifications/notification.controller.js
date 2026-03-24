const notificationService = require('./notification.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

/**
 * Handle GET /notifications
 */
const get = async (req, res, next) => {
    try {
        const notifications = await notificationService.getNotifications(req.user._id, req.query.limit);
        return sendSuccess(res, { notifications }, 'Notifications retrieved');
    } catch (error) {
        next(error);
    }
};

/**
 * Handle POST /notifications (Manual send)
 */
const send = async (req, res, next) => {
    try {
        const notification = await notificationService.sendNotification(req.body);
        return sendSuccess(res, { notification }, 'Notification sent successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Handle PUT /notifications/:id/read
 */
const read = async (req, res, next) => {
    try {
        const notification = await notificationService.markAsRead(req.params.id, req.user._id);
        return sendSuccess(res, { notification }, 'Notification marked as read');
    } catch (error) {
        next(error);
    }
};

/**
 * Mark all notifications as read for current user
 */
const readAll = async (req, res, next) => {
    try {
        await notificationService.markAllAsRead(req.user._id);
        return sendSuccess(res, null, 'All notifications marked as read');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    get,
    send,
    read,
    readAll
};
