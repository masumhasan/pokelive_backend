import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import streamRoutes from './routes/streamRoutes.js';
import raffleRoutes from './routes/raffleRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import platformRoutes from './routes/platformRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

export const app = express();

// Security and body parsing
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  const auth = req.headers.authorization ? (req.headers.authorization.startsWith('Bearer ') ? 'Bearer <token>' : req.headers.authorization) : 'none';
  console.log(`[HTTP] ${req.method} ${req.url} - Auth: ${auth}`);
  next();
});

// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'healthy', uptime: process.uptime() }));

// API Version 1 Routes
const v1 = express.Router();
v1.get('/health', (req, res) => res.status(200).json({ success: true, message: 'PokeLive API v1 online', data: { service: 'pokelive-backend', uptime: process.uptime() } }));
v1.use('/auth', authRoutes);
v1.use('/users', userRoutes);
v1.use('/sellers', sellerRoutes);
v1.use('/categories', categoryRoutes);
v1.use('/products', productRoutes);
v1.use('/cart', cartRoutes);
v1.use('/orders', orderRoutes);
v1.use('/streams', streamRoutes);
v1.use('/raffles', raffleRoutes);
v1.use('/notifications', notificationRoutes);
v1.use('/upload', uploadRoutes);
v1.use('/platform', platformRoutes);
v1.use('/stores', storeRoutes);
v1.use('/admin', adminRoutes);

app.use('/api/v1', v1);

// Central error handler
app.use(errorHandler);
