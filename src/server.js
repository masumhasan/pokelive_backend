import http from 'http';
import { app } from './app.js';
import { env, validateEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocketIO } from './sockets/socketHandler.js';
import { User } from './models/User.js';
import { Store } from './models/Store.js';

// Validate environment variables
validateEnv();

const server = http.createServer(app);

// Initialize real-time Socket.IO
initSocketIO(server, { origin: '*', credentials: true });

async function seedAdminUser() {
  const adminExists = await User.findOne({ role: 'Admin' });
  if (!adminExists) {
    await User.create({
      firstName: 'Nm',
      lastName: 'Sujon',
      name: 'Nm Sujon',
      email: 'msujon872@gmail.com',
      password: 'Password123!',
      role: 'Admin',
      status: 'Active',
      avatar: 'https://ui-avatars.com/api/?name=Nm+Sujon&background=333333&color=fff&size=64',
    });
    console.log('[Seed] Default Admin created: msujon872@gmail.com / Password123!');
  }
}

async function seedSellerUser() {
  const sellerEmail = 'seller@pokelive.com';
  let seller = await User.findOne({ email: sellerEmail });
  if (!seller) {
    seller = await User.create({
      firstName: 'Ash',
      lastName: 'Ketchum',
      name: 'Ash Ketchum',
      email: sellerEmail,
      password: 'Password123!',
      role: 'User',
      sellerStatus: 'approved',
      status: 'Active',
      avatar: 'https://i.pravatar.cc/150?img=12',
    });
    console.log(`[Seed] Default Seller created: ${sellerEmail} / Password123!`);
  }

  const storeExists = await Store.findOne({ user: seller._id });
  if (!storeExists) {
    await Store.create({
      user: seller._id,
      storeName: "Ash's PokeStore",
      sellerName: 'Ash Ketchum',
      email: sellerEmail,
      phone: '+1 234 567 8900',
      location: 'Pallet Town, Kanto',
      storeBio: 'Vintage Pokémon cards, booster boxes, and rare collectibles.',
      coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000',
      avatar: 'https://i.pravatar.cc/150?img=12',
      categories: ['Trading Cards', 'Sneaker', 'Collectibles'],
      activeProducts: 5,
      rating: 5.0,
      reviewsCount: 18,
      balance: 1250.0,
      totalSales: 3400.0,
      totalWithdrawn: 2150.0,
    });
    console.log("[Seed] Store provisioned for default seller: Ash's PokeStore");
  }
}

async function seedRegularUser() {
  const userEmail = 'user@pokelive.com';
  let user = await User.findOne({ email: userEmail });
  if (!user) {
    user = await User.create({
      firstName: 'Red',
      lastName: 'Trainer',
      name: 'Red Trainer',
      email: userEmail,
      password: 'Password123!',
      phone: '+1 987 654 3210',
      role: 'User',
      sellerStatus: 'none',
      status: 'Active',
      avatar: '',
    });
    console.log(`[Seed] Default Regular User created: ${userEmail} / Password123!`);
  }
}

import { Category } from './models/Category.js';

async function seedCategories() {
  const count = await Category.countDocuments();
  if (count === 0) {
    const defaults = [
      { name: 'Sneaker', image: 'https://ui-avatars.com/api/?name=Sneaker&background=16a34a&color=fff&size=64&bold=true' },
      { name: 'Trading Cards', image: 'https://ui-avatars.com/api/?name=TC&background=9333ea&color=fff&size=64&bold=true' },
      { name: 'Collectibles', image: 'https://ui-avatars.com/api/?name=Collectibles&background=e0620a&color=fff&size=64&bold=true' },
      { name: 'Vintage', image: 'https://ui-avatars.com/api/?name=Vintage&background=ca8a04&color=fff&size=64&bold=true' },
      { name: 'Watches', image: 'https://ui-avatars.com/api/?name=Watches&background=b91c1c&color=fff&size=64&bold=true' },
      { name: 'Apparel', image: 'https://ui-avatars.com/api/?name=Apparel&background=0891b2&color=fff&size=64&bold=true' },
      { name: 'General', image: 'https://ui-avatars.com/api/?name=General&background=444444&color=fff&size=64&bold=true' },
    ];
    await Category.insertMany(defaults);
    console.log('[Seed] Default categories seeded successfully.');
  }
}

async function startServer() {
  await connectDB();
  await seedAdminUser();
  await seedSellerUser();
  await seedRegularUser();
  await seedCategories();

  server.listen(env.port, '0.0.0.0', () => {
    console.log(`[PokeLive Backend] Running on port ${env.port} (${env.nodeEnv}) on 0.0.0.0`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => console.log('Process terminated'));
});

startServer();
