import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.js';
import * as userController from '../controllers/userController.js';
import * as adminSellerController from '../controllers/adminSellerController.js';
import * as categoryController from '../controllers/categoryController.js';
import * as adminTxController from '../controllers/adminTransactionController.js';
import * as raffleController from '../controllers/raffleController.js';
import * as platformController from '../controllers/platformController.js';

const router = Router();

// All routes below require Admin role
router.use(authenticate, requireRole('Admin'));

// Dashboard stats
router.get('/dashboard/stats', platformController.getDashboardStats);
router.get('/analytics', platformController.getDashboardStats);

// User management
router.get('/users', userController.adminGetUsers);
router.patch('/users/:id/block', userController.adminToggleBlock);
router.delete('/users/:id', userController.adminDeleteUser);

// Seller approvals & seller stores
router.get('/seller-approvals', adminSellerController.getApprovals);
router.get('/seller-applications', adminSellerController.getApprovals);
router.post('/seller-approvals/:id/approve', adminSellerController.approveApplication);
router.post('/seller-applications/:id/approve', adminSellerController.approveApplication);
router.post('/seller-approvals/:id/reject', adminSellerController.rejectApplication);
router.post('/seller-applications/:id/reject', adminSellerController.rejectApplication);
router.get('/sellers', adminSellerController.getSellers);
router.patch('/sellers/:id/block', adminSellerController.toggleBlockSeller);
router.delete('/sellers/:id', adminSellerController.deleteSeller);

// Category management
router.get('/categories', categoryController.getAll);
router.post('/categories', categoryController.create);
router.put('/categories/:id', categoryController.update);
router.delete('/categories/:id', categoryController.remove);

// Transactions & Payouts
router.get('/transactions', adminTxController.getTransactions);
router.get('/transactions/:id', adminTxController.getTransactionDetails);
router.get('/payouts', adminTxController.getPayouts);
router.post('/payouts/:id/approve', adminTxController.approvePayout);
router.post('/payouts/:id/reject', adminTxController.rejectPayout);

// Raffle management
router.get('/raffles/current', raffleController.getActive);
router.put('/raffles/current', raffleController.adminUpdateCurrent);
router.post('/raffles/:id/draw-winner', raffleController.adminDrawWinner);
router.get('/raffles/winners', raffleController.getPastWinners);
router.put('/raffles/winners/:id/status', raffleController.adminUpdateWinnerStatus);

// Reports & support tickets
router.get('/reports', platformController.getReports);
router.patch('/reports/:id/resolve', platformController.resolveReport);
router.patch('/reports/:id/dismiss', platformController.dismissReport);

// Legal & platform settings
router.get('/settings/legal', platformController.getLegal);
router.put('/settings/legal', platformController.updateLegal);

// Admin accounts management
router.get('/admins', platformController.getAdmins);
router.post('/admins', platformController.createAdmin);
router.patch('/admins/:id/toggle-block', platformController.toggleBlockAdmin);
router.delete('/admins/:id', platformController.deleteAdmin);

export default router;
