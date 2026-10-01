const BASE = 'http://localhost:5000/api/v1';

async function req(method, path, token, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log('--- Starting Profile & Seller Workflow Verification ---');

  // 1. Login as Admin
  const adminLogin = await req('POST', '/auth/login', null, {
    email: 'msujon872@gmail.com',
    password: 'Password123!',
  });
  if (!adminLogin.data.success) {
    throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.data));
  }
  const adminToken = adminLogin.data.data.token;
  console.log('✓ Admin login successful');

  // 2. Register a new Test User
  const randomSuffix = Math.floor(Math.random() * 10000);
  const testEmail = `tester_${randomSuffix}@pokelive.com`;
  const registerRes = await req('POST', '/auth/register', null, {
    firstName: 'InitialFirst',
    lastName: 'InitialLast',
    email: testEmail,
    password: 'Password123!',
  });
  if (!registerRes.data.success) {
    throw new Error('User registration failed: ' + JSON.stringify(registerRes.data));
  }
  const userToken = registerRes.data.data.token;
  const userId = registerRes.data.data.user._id || registerRes.data.data.user.id;
  console.log('✓ Test user registered:', testEmail);

  // 3. Edit User Profile
  const updateRes = await req('PUT', '/users/profile', userToken, {
    firstName: 'UpdatedFirst',
    lastName: 'UpdatedLast',
    phone: '+1-555-0199',
    city: 'New York',
    address: '742 Evergreen Terrace',
    gender: 'Male',
  });
  if (!updateRes.data.success) {
    throw new Error('Profile update failed: ' + JSON.stringify(updateRes.data));
  }
  const updatedUser = updateRes.data.data;
  if (
    updatedUser.firstName !== 'UpdatedFirst' ||
    updatedUser.lastName !== 'UpdatedLast' ||
    updatedUser.phone !== '+1-555-0199' ||
    updatedUser.name !== 'UpdatedFirst UpdatedLast' ||
    updatedUser.city !== 'New York' ||
    updatedUser.address !== '742 Evergreen Terrace'
  ) {
    throw new Error('Profile fields were not stored properly! ' + JSON.stringify(updatedUser));
  }
  console.log('✓ Profile edit verified: all fields stored properly');

  // 4. Submit Seller Application with full details
  const applyPayload = {
    applicantName: 'UpdatedFirst UpdatedLast',
    phone: '+1-555-0199',
    address: '742 Evergreen Terrace, New York',
    idDocumentType: 'Passport',
    nidFront: 'https://images.unsplash.com/photo-test-front',
    nidBack: 'https://images.unsplash.com/photo-test-back',
    storeName: `Elite Pokecards ${randomSuffix}`,
    shopDescription: 'Specializing in rare mint trading cards and live breaks.',
    categories: ['Trading Cards', 'Sneaker'],
  };

  const applyRes = await req('POST', '/sellers/apply', userToken, applyPayload);
  if (!applyRes.data.success) {
    throw new Error('Seller application submission failed: ' + JSON.stringify(applyRes.data));
  }
  const app = applyRes.data.data;
  if (
    app.storeName !== applyPayload.storeName ||
    app.applicantName !== applyPayload.applicantName ||
    app.idDocumentType !== 'Passport' ||
    app.nidFront !== applyPayload.nidFront ||
    app.nidBack !== applyPayload.nidBack ||
    app.categories.length !== 2
  ) {
    throw new Error('Seller application fields not stored properly: ' + JSON.stringify(app));
  }
  console.log('✓ Seller application submitted: all form fields stored properly in database');

  // 5. Verify Seller Request appears in Admin Dashboard endpoint
  const adminApprovals = await req('GET', `/admin/seller-approvals?search=${encodeURIComponent(applyPayload.storeName)}`, adminToken);
  if (!adminApprovals.data.success) {
    throw new Error('Failed to fetch admin seller approvals: ' + JSON.stringify(adminApprovals.data));
  }
  const foundApp = adminApprovals.data.data.find((a) => a.storeName === applyPayload.storeName);
  if (!foundApp) {
    throw new Error('Submitted seller application did not appear in admin approvals list!');
  }
  console.log('✓ Application confirmed visible in Admin Dashboard seller-approvals list');

  // 6. Test Admin Deny / Reject Seller Request
  const rejectRes = await req('POST', `/admin/seller-approvals/${foundApp._id}/reject`, adminToken, {
    reason: 'Document photo is slightly blurry. Please resubmit.',
  });
  if (!rejectRes.data.success) {
    throw new Error('Admin reject application failed: ' + JSON.stringify(rejectRes.data));
  }
  console.log('✓ Admin successfully denied/rejected seller request with reason');

  // Check user status after rejection
  const statusAfterReject = await req('GET', '/sellers/status', userToken);
  if (statusAfterReject.data.data.sellerStatus !== 'rejected') {
    throw new Error('User sellerStatus should be rejected, got: ' + statusAfterReject.data.data.sellerStatus);
  }
  console.log('✓ User seller status properly updated to "rejected"');

  // 7. Submit new application after rejection
  const reApplyRes = await req('POST', '/sellers/apply', userToken, {
    ...applyPayload,
    storeName: `Elite Pokecards Verified ${randomSuffix}`,
    nidFront: 'https://images.unsplash.com/photo-clear-front',
  });
  if (!reApplyRes.data.success) {
    throw new Error('Re-applying after rejection failed: ' + JSON.stringify(reApplyRes.data));
  }
  const newAppId = reApplyRes.data.data._id;
  console.log('✓ User able to resubmit seller application');

  // 8. Test Admin Approve Seller Request
  const approveRes = await req('POST', `/admin/seller-approvals/${newAppId}/approve`, adminToken, {
    notes: 'Documents verified and approved.',
  });
  if (!approveRes.data.success) {
    throw new Error('Admin approve application failed: ' + JSON.stringify(approveRes.data));
  }
  console.log('✓ Admin successfully approved seller application');

  // 9. Verify User role and store creation
  const statusAfterApprove = await req('GET', '/sellers/status', userToken);
  if (statusAfterApprove.data.data.sellerStatus !== 'approved') {
    throw new Error('User sellerStatus should be approved, got: ' + statusAfterApprove.data.data.sellerStatus);
  }
  console.log('✓ User seller status confirmed as "approved" in database');

  const hubSummary = await req('GET', '/sellers/hub/summary', userToken);
  if (!hubSummary.data.success || !hubSummary.data.data.storeName) {
    throw new Error('Store was not initialized for approved seller: ' + JSON.stringify(hubSummary.data));
  }
  console.log('✓ Storefront initialized with storeName:', hubSummary.data.data.storeName);

  console.log('\n======================================================');
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('======================================================');
}

run().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
