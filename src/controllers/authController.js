import * as authService from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';

export async function register(req, res, next) {
  try {
    const data = await authService.registerUser(req.body);
    return sendSuccess(res, data, 'Registration successful', 201);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const data = await authService.loginUser(req.body);
    return sendSuccess(res, data, 'Login successful');
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const data = await authService.sendForgotPasswordOtp(req.body.email);
    return sendSuccess(res, data, 'Password reset OTP dispatched.');
  } catch (error) {
    next(error);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    const data = await authService.verifyOtp(req.body.email, req.body.otp);
    return sendSuccess(res, data, 'OTP verified successfully.');
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const data = await authService.resetPassword(req.body);
    return sendSuccess(res, data, 'Password reset successfully.');
  } catch (error) {
    next(error);
  }
}
