import { Notification } from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(30);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await Notification.updateMany({ userId: req.user._id }, { $set: { isRead: true } });
      return res.json({ success: true, message: 'All marked as read.' });
    }
    await Notification.findOneAndUpdate({ _id: id, userId: req.user._id }, { $set: { isRead: true } });
    res.json({ success: true, message: 'Marked as read.' });
  } catch (error) {
    next(error);
  }
};
