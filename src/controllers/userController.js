import * as userService from '../services/userService.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

export async function getMe(req, res, next) {
  try {
    const user = await userService.getProfile(req.user._id);
    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req, res, next) {
  try {
    const updated = await userService.updateProfile(req.user._id, req.body);
    return sendSuccess(res, updated, 'Profile updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const result = await userService.changePassword(
      req.user._id,
      req.body.currentPassword,
      req.body.newPassword
    );
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

// ─── Addresses ──────────────────────────────────────────────────────────────
export async function getAddresses(req, res, next) {
  try {
    const addresses = await userService.getAddresses(req.user._id);
    return sendSuccess(res, addresses);
  } catch (error) {
    next(error);
  }
}

export async function createAddress(req, res, next) {
  try {
    const address = await userService.createAddress(req.user._id, req.body);
    return sendSuccess(res, address, 'Address added successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateAddress(req, res, next) {
  try {
    const updated = await userService.updateAddress(req.user._id, req.params.id, req.body);
    return sendSuccess(res, updated, 'Address updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function deleteAddress(req, res, next) {
  try {
    const result = await userService.deleteAddress(req.user._id, req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

// ─── Admin Controller Operations ────────────────────────────────────────────
export async function adminGetUsers(req, res, next) {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const { users, total } = await userService.adminListUsers({ search, page, limit, role, status });
    return sendPaginated(res, users, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function adminToggleBlock(req, res, next) {
  try {
    const result = await userService.adminToggleBlockUser(req.params.id);
    return sendSuccess(res, result, 'User block status updated.');
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteUser(req, res, next) {
  try {
    const result = await userService.adminDeleteUser(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
