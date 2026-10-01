import * as notificationService from '../services/notificationService.js';
import { sendSuccess } from '../utils/response.js';

export async function getAll(req, res, next) {
  try {
    const list = await notificationService.getUserNotifications(req.user._id);
    return sendSuccess(res, list);
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req, res, next) {
  try {
    const result = await notificationService.markAllRead(req.user._id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function markRead(req, res, next) {
  try {
    const notification = await notificationService.markRead(req.user._id, req.params.id);
    return sendSuccess(res, notification);
  } catch (error) {
    next(error);
  }
}
