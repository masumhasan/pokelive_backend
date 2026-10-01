// Automated API Integration Test Suite for PokeLive Backend
const BASE_URL = 'http://localhost:5000/api/v1';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

function assert(condition, message, details = '') {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`, details);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting PokeLive API Integration Tests...\n');

  // 1. Health check
  const health = await request('/health');
  assert(health.ok && health.data?.data?.service === 'pokelive-backend', 'Health check responds');

  // 2. Admin Login
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'msujon872@gmail.com', password: 'Password123!' }),
  });
  assert(adminLogin.ok && adminLogin.data?.data?.token, 'Admin login succeeded', adminLogin.data);
  const adminToken = adminLogin.data.data.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // 3. User Registration
  const testEmail = `collector_${Date.now()}@pokelive.com`;
  const registerRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'UserPass123!',
      firstName: 'Ash',
      lastName: 'Ketchum',
    }),
  });
  assert(registerRes.ok && registerRes.data?.data?.token, 'User registration succeeded', registerRes.data);
  const userToken = registerRes.data.data.token;
  const userHeaders = { Authorization: `Bearer ${userToken}` };
  const userId = registerRes.data.data.user._id;

  // 4. User Profile
  const profileRes = await request('/users/profile', { headers: userHeaders });
  assert(profileRes.ok && profileRes.data?.data?.email === testEmail, 'User profile fetched', profileRes.data);

  // 5. Add Address
  const addressRes = await request('/users/addresses', {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({
      firstName: 'Ash',
      lastName: 'Ketchum',
      contactNumber: '+1234567890',
      streetAddress: '123 Pallet Town Way',
      city: 'Pallet Town',
      state: 'Kanto',
      postalCode: '10001',
      country: 'USA',
      isDefault: true,
    }),
  });
  assert(addressRes.ok && addressRes.data?.data?.city === 'Pallet Town', 'User address added', addressRes.data);
  const addressId = addressRes.data.data._id;

  // 6. Category Creation (Admin)
  const catRes = await request('/categories', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name: `Trading Cards ${Date.now()}`,
      description: 'Rare Pokémon and collectible cards',
      image: 'https://images.unsplash.com/photo-tcg.png',
    }),
  });
  assert(catRes.ok && catRes.data?.data?._id, 'Category created by Admin', catRes.data);
  const categoryId = catRes.data.data._id;

  // 7. Get Categories (Public)
  const listCatRes = await request('/categories');
  assert(listCatRes.ok && Array.isArray(listCatRes.data?.data) && listCatRes.data.data.length > 0, 'Categories listed', listCatRes.data);

  // 8. Seller Application Flow
  // Step A: Regular user cannot create product before approval
  const unauthProductRes = await request('/products', {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({
      name: 'Charizard 1st Edition',
      price: 250,
      quantity: 5,
      category: categoryId,
    }),
  });
  assert(unauthProductRes.status === 403, 'Unapproved user blocked from creating product (403)');

  // Step B: Submit Seller Application
  const applyRes = await request('/sellers/apply', {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({
      businessName: "Ash's Card Shop",
      businessType: 'Individual',
      email: testEmail,
      phone: '+1234567890',
      address: {
        street: '123 Pallet Way',
        city: 'Pallet Town',
        state: 'Kanto',
        zipCode: '10001',
        country: 'USA',
      },
      documentType: 'Passport',
      documentNumber: 'P123456789',
      category: 'Trading Cards',
      description: 'Premier Pokemon cards vendor',
      senderAddress: {
        fullName: 'Ash Ketchum',
        phone: '+1234567890',
        street: '123 Pallet Way',
        city: 'Pallet Town',
        state: 'Kanto',
        zipCode: '10001',
      },
    }),
  });
  assert(applyRes.ok && applyRes.data?.data?.status === 'pending', 'Seller application submitted', applyRes.data);
  const applicationId = applyRes.data.data._id;

  // Step C: Check status (User)
  const statusRes = await request('/sellers/application-status', { headers: userHeaders });
  assert(statusRes.ok && statusRes.data?.data?.sellerStatus === 'pending', 'Seller application status is pending', statusRes.data);

  // Step D: Admin lists applications
  const adminAppsRes = await request('/admin/seller-applications', { headers: adminHeaders });
  assert(adminAppsRes.ok && adminAppsRes.data?.data?.some(a => a._id === applicationId), 'Admin sees seller application', adminAppsRes.data);

  // Step E: Admin approves application
  const approveRes = await request(`/admin/seller-applications/${applicationId}/approve`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ notes: 'Verified credentials.' }),
  });
  assert(approveRes.ok && approveRes.data?.data?.store, 'Admin approved seller application', approveRes.data);

  // Step F: Refresh user session/verify seller status
  const sellerStatusRes = await request('/sellers/application-status', { headers: userHeaders });
  assert(sellerStatusRes.ok && sellerStatusRes.data?.data?.sellerStatus === 'approved', 'User is now approved seller', sellerStatusRes.data);

  // 9. Seller Creates Product
  const createProductRes = await request('/products', {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({
      name: 'Charizard Base Set Holo PSA 9',
      description: 'Mint condition 1st edition Shadowless Charizard',
      price: 499.99,
      quantity: 3,
      category: categoryId,
      images: ['https://s3.amazonaws.com/pokelive/charizard.jpg'],
      condition: 'Mint',
    }),
  });
  assert(createProductRes.ok && createProductRes.data?.data?._id, 'Approved seller created product', createProductRes.data);
  const productId = createProductRes.data.data._id;

  // 10. List Products (Public)
  const listProductsRes = await request('/products');
  assert(listProductsRes.ok && listProductsRes.data?.data?.length > 0, 'Public products list retrieved', listProductsRes.data);

  // 11. Cart Lifecycle
  const addToCartRes = await request('/cart', {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  assert(addToCartRes.ok && addToCartRes.data?.data?.totalItems >= 1, 'Product added to cart', addToCartRes.data);

  const getCartRes = await request('/cart', { headers: userHeaders });
  assert(getCartRes.ok && getCartRes.data?.data?.subtotal > 0, 'Cart viewed with calculated subtotal', getCartRes.data);

  // 12. Order Checkout Lifecycle & Concurrency/Stock Decrement
  const checkoutRes = await request('/orders/checkout', {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({
      shippingAddressId: addressId,
      paymentMethod: 'card',
    }),
  });
  const createdOrders = Array.isArray(checkoutRes.data?.data) ? checkoutRes.data.data : [checkoutRes.data?.data];
  assert(checkoutRes.ok && createdOrders[0]?._id, 'Order checkout succeeded', checkoutRes.data);
  const orderId = createdOrders[0]._id;

  // Verify stock decremented from 3 to 2
  const checkStockRes = await request(`/products/${productId}`);
  assert(checkStockRes.ok && checkStockRes.data?.data?.quantity === 2, 'Stock atomically decremented from 3 to 2', checkStockRes.data);

  // 13. Livestream & GetStream Lifecycle
  const streamRes = await request('/streams', {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({
      title: 'Charizard Box Break & Single Sales!',
      description: 'Live box break of vintage booster packs',
      products: [productId],
      category: categoryId,
    }),
  });
  assert(streamRes.ok && streamRes.data?.data?.stream?._id, 'Seller created live stream', streamRes.data);
  const streamId = streamRes.data.data.stream._id;
  assert(streamRes.data.data.streamToken, 'GetStream user token generated');

  // Viewer joins stream
  const joinStreamRes = await request(`/streams/${streamId}`, { headers: userHeaders });
  assert(joinStreamRes.ok && joinStreamRes.data?.data?.stream?.callId, 'Viewer fetched live stream details & callId', joinStreamRes.data);

  // 14. Raffles
  const rafflesRes = await request('/raffles');
  assert(rafflesRes.ok, 'Raffles endpoint works', rafflesRes.data);

  // 15. S3 Presigned URL
  const presignRes = await request('/upload/presign', {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({
      fileType: 'image/jpeg',
      folder: 'products',
    }),
  });
  assert(presignRes.ok && presignRes.data?.data?.uploadUrl && (presignRes.data?.data?.publicUrl || presignRes.data?.data?.fileUrl), 'S3 presigned URL generated securely', presignRes.data);

  // 16. Admin Analytics
  const adminStatsRes = await request('/admin/analytics', { headers: adminHeaders });
  assert(adminStatsRes.ok && Array.isArray(adminStatsRes.data?.data?.stats), 'Admin analytics fetched', adminStatsRes.data);

  console.log('\n🎉 ALL 16 INTEGRATION TEST SUITES PASSED FLAWLESSLY!\n');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
