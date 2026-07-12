const mongoose = require('mongoose');
const http = require('http');
const dotenv = require('dotenv');
const Employee = require('./src/models/Employee');
const Department = require('./src/models/Department');
const AssetCategory = require('./src/models/AssetCategory');

dotenv.config();

const PORT = 5000;
const HOST = 'localhost';

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let body = data;
        try {
          body = JSON.parse(data);
        } catch (e) {
          // keep as string
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

const run = async () => {
  console.log('=== connecting to DB for test setup ===');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  // Clean up any old test users/departments/categories
  await Employee.deleteMany({ email: /test_phase2/ });
  await Department.deleteMany({ name: /Test Dept/ });
  await AssetCategory.deleteMany({ name: /Test Category/ });

  // Create an Admin user directly in DB
  const adminEmail = 'admin_test_phase2@example.com';
  const admin = await Employee.create({
    name: 'Test Admin',
    email: adminEmail,
    passwordHash: 'password123', // hooks will auto-hash
    role: 'Admin'
  });
  console.log('Admin user created in DB directly.');

  // Create a regular Employee directly in DB
  const empEmail = 'emp_test_phase2@example.com';
  const employee = await Employee.create({
    name: 'Test Employee',
    email: empEmail,
    passwordHash: 'password123',
    role: 'Employee'
  });
  console.log('Regular employee created in DB directly.');

  // Log in Admin
  console.log('Logging in Admin via API...');
  const adminLoginRes = await makeRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: adminEmail, password: 'password123' });

  const adminToken = adminLoginRes.body.token;
  console.log('Admin logged in, token acquired.');

  // Log in regular Employee
  console.log('Logging in Regular Employee via API...');
  const empLoginRes = await makeRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: empEmail, password: 'password123' });

  const empToken = empLoginRes.body.token;
  console.log('Regular employee logged in, token acquired.');

  console.log('\n--- STARTING ORG SETUP API TESTS ---');

  // Test 1: Access without token (401)
  console.log('1. Testing GET /api/departments (no token)...');
  const t1 = await makeRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/departments',
    method: 'GET'
  });
  console.log(`-> Status: ${t1.statusCode} (Expected: 401)`);

  // Test 2: Access with Employee token (403)
  console.log('2. Testing GET /api/departments (Employee token)...');
  const t2 = await makeRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/departments',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${empToken}` }
  });
  console.log(`-> Status: ${t2.statusCode} (Expected: 403)`);

  // Test 3: Create Department (Admin token)
  console.log('3. Testing POST /api/departments (Admin)...');
  const t3 = await makeRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/departments',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    name: 'Test Dept 1',
    headEmployeeId: employee._id
  });
  console.log(`-> Status: ${t3.statusCode} (Expected: 201)`);
  console.log(`-> Body: ${JSON.stringify(t3.body)}`);
  const createdDeptId = t3.body.department._id;

  // Test 4: Get Departments (Admin token)
  console.log('4. Testing GET /api/departments (Admin)...');
  const t4 = await makeRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/departments',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log(`-> Status: ${t4.statusCode} (Expected: 200)`);
  console.log(`-> Count: ${t4.body.departments.length}`);

  // Test 5: Update Department (Admin token)
  console.log('5. Testing PATCH /api/departments/:id (Admin)...');
  const t5 = await makeRequest({
    hostname: HOST,
    port: PORT,
    path: `/api/departments/${createdDeptId}`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    status: 'Inactive'
  });
  console.log(`-> Status: ${t5.statusCode} (Expected: 200)`);
  console.log(`-> Updated status: ${t5.body.department.status}`);

  // Test 6: Create Category (Admin token)
  console.log('6. Testing POST /api/asset-categories (Admin)...');
  const t6 = await makeRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/asset-categories',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    name: 'Test Category 1',
    customFields: { warrantyMonths: 12 }
  });
  console.log(`-> Status: ${t6.statusCode} (Expected: 201)`);
  console.log(`-> Body: ${JSON.stringify(t6.body)}`);

  // Test 7: Duplicate Category (Admin token - should fail 409)
  console.log('7. Testing duplicate POST /api/asset-categories (Admin)...');
  const t7 = await makeRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/asset-categories',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    name: 'Test Category 1'
  });
  console.log(`-> Status: ${t7.statusCode} (Expected: 409)`);

  // Test 8: Get Categories (Admin token)
  console.log('8. Testing GET /api/asset-categories (Admin)...');
  const t8 = await makeRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/asset-categories',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log(`-> Status: ${t8.statusCode} (Expected: 200)`);
  console.log(`-> Count: ${t8.body.categories.length}`);

  // Test 9: Get Employees (Admin token)
  console.log('9. Testing GET /api/employees (Admin)...');
  const t9 = await makeRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/employees',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log(`-> Status: ${t9.statusCode} (Expected: 200)`);
  console.log(`-> Count: ${t9.body.employees.length}`);

  // Test 10: Promote Regular Employee to Asset Manager
  console.log(`10. Testing PATCH /api/employees/${employee._id}/role (Admin)...`);
  const t10 = await makeRequest({
    hostname: HOST,
    port: PORT,
    path: `/api/employees/${employee._id}/role`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    role: 'Asset Manager'
  });
  console.log(`-> Status: ${t10.statusCode} (Expected: 200)`);
  console.log(`-> Updated role: ${t10.body.employee.role}`);

  console.log('\n=== cleaning up test data ===');
  await Employee.deleteMany({ email: /test_phase2/ });
  await Department.deleteMany({ name: /Test Dept/ });
  await AssetCategory.deleteMany({ name: /Test Category/ });
  console.log('Cleaned up.');

  await mongoose.disconnect();
  console.log('=== ALL TESTS COMPLETED ===');
};

run().catch(err => {
  console.error('Test execution failed:', err);
  mongoose.disconnect();
});
