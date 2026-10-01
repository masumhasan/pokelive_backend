import * as platformService from '../services/platformService.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

export async function submitSupportTicket(req, res, next) {
  try {
    const report = await platformService.createReport(req.user._id, req.body);
    return sendSuccess(res, report, 'Support request submitted.', 201);
  } catch (error) {
    next(error);
  }
}

export async function getReports(req, res, next) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const { reports, total } = await platformService.listReports({ page, limit, search });
    return sendPaginated(res, reports, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function resolveReport(req, res, next) {
  try {
    const report = await platformService.resolveReport(req.params.id);
    return sendSuccess(res, report, 'Report marked as resolved.');
  } catch (error) {
    next(error);
  }
}

export async function dismissReport(req, res, next) {
  try {
    const report = await platformService.dismissReport(req.params.id);
    return sendSuccess(res, report, 'Report dismissed.');
  } catch (error) {
    next(error);
  }
}

export async function getLegal(req, res, next) {
  try {
    const legal = await platformService.getLegalSettings();
    return sendSuccess(res, legal);
  } catch (error) {
    next(error);
  }
}

export async function updateLegal(req, res, next) {
  try {
    const { key, value } = req.body;
    const updated = await platformService.updateLegalSetting(key, value);
    return sendSuccess(res, updated, 'Setting updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getDashboardStats(req, res, next) {
  try {
    const stats = await platformService.getDashboardStats();
    return sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
}

export async function getAdmins(req, res, next) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const { admins, total } = await platformService.listAdmins({ page, limit, search });
    return sendPaginated(res, admins, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function createAdmin(req, res, next) {
  try {
    const admin = await platformService.createAdmin(req.body);
    return sendSuccess(res, admin, 'Admin created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function toggleBlockAdmin(req, res, next) {
  try {
    const result = await platformService.toggleBlockAdmin(req.params.id);
    return sendSuccess(res, result, 'Admin block status updated.');
  } catch (error) {
    next(error);
  }
}

export async function deleteAdmin(req, res, next) {
  try {
    const result = await platformService.deleteAdmin(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
