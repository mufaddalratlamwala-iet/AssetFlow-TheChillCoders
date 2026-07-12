const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Employee = require('../models/Employee');
const Department = require('../models/Department');
const AssetCategory = require('../models/AssetCategory');
const assetService = require('../services/assetService');
const Allocation = require('../models/Allocation');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

const seedData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected!');

        // Clear existing data
        console.log('Clearing existing data...');
        await Employee.deleteMany({});
        await Department.deleteMany({});
        await AssetCategory.deleteMany({});
        await Allocation.deleteMany({});
        await MaintenanceRequest.deleteMany({});
        await Booking.deleteMany({});
        await Notification.deleteMany({});
        await ActivityLog.deleteMany({});
        // Clean up assets directly via model to avoid service check constraints if any
        const Asset = require('../models/Asset');
        await Asset.deleteMany({});
        console.log('Existing data cleared.');

        // 1. Create Departments
        console.log('Creating Departments...');
        const engineeringDept = await Department.create({ name: 'Engineering', status: 'Active' });
        const hrDept = await Department.create({ name: 'Human Resources', status: 'Active' });
        const designDept = await Department.create({ name: 'Design', status: 'Active' });
        console.log('Departments created.');

        // 2. Create Employees
        console.log('Creating Employees...');
        const admin = await Employee.create({
            name: 'Admin User',
            email: 'admin@assetflow.com',
            passwordHash: 'admin123',
            role: 'Admin',
            status: 'Active'
        });

        const manager = await Employee.create({
            name: 'Asset Manager User',
            email: 'manager@assetflow.com',
            passwordHash: 'manager123',
            role: 'Asset Manager',
            status: 'Active'
        });

        const head = await Employee.create({
            name: 'Engineering Head',
            email: 'head@assetflow.com',
            passwordHash: 'head123',
            role: 'Department Head',
            departmentId: engineeringDept._id,
            status: 'Active'
        });

        const emp1 = await Employee.create({
            name: 'John Doe',
            email: 'emp1@assetflow.com',
            passwordHash: 'emp123',
            role: 'Employee',
            departmentId: engineeringDept._id,
            status: 'Active'
        });

        const emp2 = await Employee.create({
            name: 'Jane Smith',
            email: 'emp2@assetflow.com',
            passwordHash: 'emp123',
            role: 'Employee',
            departmentId: hrDept._id,
            status: 'Active'
        });
        console.log('Employees created.');

        // Link Department Head
        engineeringDept.headEmployeeId = head._id;
        await engineeringDept.save();

        // 3. Create Asset Categories
        console.log('Creating Asset Categories...');
        const laptopsCat = await AssetCategory.create({
            name: 'Laptops',
            customFields: {
                ram: { type: 'String', required: true },
                storage: { type: 'String', required: true },
                processor: { type: 'String', required: true }
            }
        });

        const furnitureCat = await AssetCategory.create({
            name: 'Furniture',
            customFields: {
                material: { type: 'String', required: false },
                dimensions: { type: 'String', required: false }
            }
        });

        const vehiclesCat = await AssetCategory.create({
            name: 'Vehicles',
            customFields: {
                modelYear: { type: 'Number', required: true },
                licensePlate: { type: 'String', required: true }
            }
        });
        console.log('Asset Categories created.');

        // 4. Create Assets
        console.log('Creating Assets...');
        const asset1 = await assetService.create({
            name: 'MacBook Pro 16" (M3 Max)',
            categoryId: laptopsCat._id,
            serialNumber: 'C02X874KMD6M',
            qrCode: 'QR-MAC-001',
            acquisitionDate: new Date('2026-01-10'),
            acquisitionCost: 3499,
            condition: 'New',
            location: 'London - HQ-B3',
            isBookable: true,
            status: 'Available'
        }, admin._id);

        const asset2 = await assetService.create({
            name: 'Dell PowerEdge R750',
            categoryId: laptopsCat._id,
            serialNumber: 'PE-R750-XYZ',
            qrCode: 'QR-DELL-002',
            acquisitionDate: new Date('2025-06-15'),
            acquisitionCost: 8500,
            condition: 'Good',
            location: 'AWS West - DC2',
            isBookable: false,
            status: 'Allocated'
        }, admin._id);

        const asset3 = await assetService.create({
            name: 'Cisco Catalyst 9300',
            categoryId: laptopsCat._id,
            serialNumber: 'CSCO-9300-881',
            qrCode: 'QR-CISCO-003',
            acquisitionDate: new Date('2024-11-20'),
            acquisitionCost: 1500,
            condition: 'Good',
            location: 'Berlin - SITE-A',
            isBookable: false,
            status: 'Under Maintenance'
        }, admin._id);

        const asset4 = await assetService.create({
            name: 'Pure Storage FlashArray',
            categoryId: laptopsCat._id,
            serialNumber: 'PURE-STO-21',
            qrCode: 'QR-PURE-004',
            acquisitionDate: new Date('2025-03-01'),
            acquisitionCost: 12500,
            condition: 'Good',
            location: 'Dublin - EUW-1',
            isBookable: false,
            status: 'Available'
        }, admin._id);
        console.log('Assets created.');

        // 5. Create Allocations
        console.log('Creating Allocations...');
        await Allocation.create({
            assetId: asset2._id,
            employeeId: emp1._id,
            departmentId: engineeringDept._id,
            allocatedAt: new Date('2026-06-01'),
            status: 'Active'
        });
        console.log('Allocations created.');

        // 6. Create Maintenance Requests
        console.log('Creating Maintenance Requests...');
        await MaintenanceRequest.create({
            assetId: asset3._id,
            raisedBy: emp1._id,
            issueDescription: 'Network port 5 intermittently drops link.',
            priority: 'High',
            status: 'Pending'
        });
        await MaintenanceRequest.create({
            assetId: asset2._id,
            raisedBy: emp2._id,
            issueDescription: 'PSU failure replacement.',
            priority: 'Urgent',
            status: 'Resolved',
            resolvedAt: new Date('2026-06-15')
        });
        console.log('Maintenance Requests created.');

        // 7. Create Bookings
        console.log('Creating Bookings...');
        await Booking.create({
            resourceAssetId: asset1._id,
            bookedBy: emp1._id,
            startTime: new Date('2026-07-12T09:00:00Z'),
            endTime: new Date('2026-07-12T11:00:00Z'),
            status: 'Completed'
        });
        await Booking.create({
            resourceAssetId: asset1._id,
            bookedBy: emp1._id,
            startTime: new Date('2026-07-12T14:00:00Z'),
            endTime: new Date('2026-07-12T16:00:00Z'),
            status: 'Completed'
        });
        await Booking.create({
            resourceAssetId: asset4._id,
            bookedBy: emp2._id,
            startTime: new Date('2026-07-13T10:00:00Z'),
            endTime: new Date('2026-07-13T12:00:00Z'),
            status: 'Upcoming'
        });
        console.log('Bookings created.');

        // 8. Create Notifications
        console.log('Creating Notifications...');
        await Notification.create({
            employeeId: emp1._id,
            type: 'Asset Assigned',
            message: 'You have been assigned Dell PowerEdge R750.',
            read: false
        });
        await Notification.create({
            employeeId: emp2._id,
            type: 'Maintenance Approved',
            message: 'Maintenance request for Dell PowerEdge R750 has been approved.',
            read: true
        });
        await Notification.create({
            employeeId: admin._id,
            type: 'System Alert',
            message: 'A new maintenance request has been submitted for Cisco Catalyst 9300.',
            read: false
        });
        console.log('Notifications created.');

        // 9. Create Activity Logs
        console.log('Creating Activity Logs...');
        await ActivityLog.create({
            employeeId: admin._id,
            action: 'POST',
            entityType: 'Asset',
            entityId: asset1._id,
            metadata: { name: asset1.name }
        });
        await ActivityLog.create({
            employeeId: emp1._id,
            action: 'POST',
            entityType: 'MaintenanceRequest',
            entityId: asset3._id,
            metadata: { description: 'Network port 5 intermittently drops link.' }
        });
        await ActivityLog.create({
            employeeId: emp2._id,
            action: 'PATCH',
            entityType: 'Allocation',
            entityId: asset2._id,
            metadata: { status: 'Active' }
        });
        console.log('Activity Logs created.');

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
