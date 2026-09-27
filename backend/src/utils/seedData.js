const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const ServiceJob = require('../models/ServiceJob');
const Inspection = require('../models/Inspection');
const Part = require('../models/Part');
const Estimate = require('../models/Estimate');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');

const seedData = async () => {
  try {
    console.log('Seeding AutoFlow database with realistic demo dataset...');

    if (await User.exists()) {
      console.log('Database already contains data. Skipping demo seed.');
      return;
    }

    // Clear existing data
    await User.deleteMany();
    await Customer.deleteMany();
    await Vehicle.deleteMany();
    await Booking.deleteMany();
    await ServiceJob.deleteMany();
    await Inspection.deleteMany();
    await Part.deleteMany();
    await Estimate.deleteMany();
    await Invoice.deleteMany();
    await Payment.deleteMany();
    await AuditLog.deleteMany();

    // 1. Create Core Users
    const adminUser = await User.create({
      name: 'Vikram Singh (Admin)',
      email: 'admin@autoflow.com',
      password: 'password123',
      role: 'ADMIN',
      phone: '+91 98200 11223',
    });

    const advisorUser = await User.create({
      name: 'Rajesh Kumar (Service Advisor)',
      email: 'advisor@autoflow.com',
      password: 'password123',
      role: 'SERVICE_ADVISOR',
      phone: '+91 98200 22334',
    });

    const advisor2 = await User.create({
      name: 'Priya Sharma (Service Advisor)',
      email: 'priya@autoflow.com',
      password: 'password123',
      role: 'SERVICE_ADVISOR',
      phone: '+91 98200 22335',
    });

    const mechanicUser = await User.create({
      name: 'Rahul Sharma (Senior Technician)',
      email: 'mechanic@autoflow.com',
      password: 'password123',
      role: 'MECHANIC',
      phone: '+91 98200 33445',
      specialization: 'Engine & Brake Specialist',
    });

    const mechanic2 = await User.create({
      name: 'Suresh Verma (Technician)',
      email: 'suresh@autoflow.com',
      password: 'password123',
      role: 'MECHANIC',
      phone: '+91 98200 33446',
      specialization: 'Electrical & AC Specialist',
    });

    const mechanic3 = await User.create({
      name: 'Anil Deshmukh (Suspension Specialist)',
      email: 'anil@autoflow.com',
      password: 'password123',
      role: 'MECHANIC',
      phone: '+91 98200 33447',
      specialization: 'Suspension & Steering',
    });

    // Primary Demo Customer: Amit Patil
    const amitCustomerUser = await User.create({
      name: 'Amit Patil (Demo Customer)',
      email: 'amit@autoflow.com',
      password: 'password123',
      role: 'CUSTOMER',
      phone: '+91 98765 43210',
    });
    await Customer.create({
      userId: amitCustomerUser._id,
      address: 'Flat 402, Green Valley Towers, Pune',
      emergencyContact: '+91 98765 00000',
    });

    // Additional Customers
    const customerNames = [
      'Sneha Kulkarni', 'Rohan Mehta', 'Deepak Joshi', 'Neha Gupta', 'Vikrant Patil',
      'Ananya Roy', 'Manish Shah', 'Kavita Nair', 'Saurabh Chawla', 'Pooja Reddy',
      'Abhishek Rao', 'Ritu Saxena', 'Gaurav Bhatia', 'Smita Dave', 'Tushar Aggarwal',
    ];

    const customerUsers = [amitCustomerUser];

    for (let i = 0; i < customerNames.length; i++) {
      const u = await User.create({
        name: customerNames[i],
        email: `customer${i + 1}@autoflow.com`,
        password: 'password123',
        role: 'CUSTOMER',
        phone: `+91 98111 ${10000 + i}`,
      });
      await Customer.create({
        userId: u._id,
        address: `Sector ${i + 1}, Pune, Maharashtra`,
        emergencyContact: `+91 98111 ${20000 + i}`,
      });
      customerUsers.push(u);
    }

    // 2. Create Vehicles
    // Primary Demo Vehicle for Amit Patil
    const hondaCity = await Vehicle.create({
      customerId: amitCustomerUser._id,
      registrationNumber: 'MH10AB1234',
      make: 'Honda',
      model: 'City',
      year: 2021,
      color: 'Pearl White',
      fuelType: 'PETROL',
      mileage: 45200,
      vin: 'MA3HC5512009876',
    });

    const vehicleTemplates = [
      { make: 'Hyundai', model: 'Creta', year: 2022, fuelType: 'DIESEL', reg: 'MH12CD5678' },
      { make: 'Maruti Suzuki', model: 'Swift Dzire', year: 2020, fuelType: 'CNG', reg: 'MH14EF9012' },
      { make: 'Toyota', model: 'Fortuner', year: 2023, fuelType: 'DIESEL', reg: 'MH12GH3456' },
      { make: 'Tata', model: 'Nexon EV', year: 2023, fuelType: 'ELECTRIC', reg: 'MH12IJ7890' },
      { make: 'Kia', model: 'Seltos', year: 2022, fuelType: 'PETROL', reg: 'MH12KL1234' },
      { make: 'Mahindra', model: 'Thar', year: 2021, fuelType: 'DIESEL', reg: 'MH12MN5678' },
      { make: 'Volkswagen', model: 'Virtus', year: 2023, fuelType: 'PETROL', reg: 'MH12OP9012' },
      { make: 'Skoda', model: 'Slavia', year: 2022, fuelType: 'PETROL', reg: 'MH12QR3456' },
      { make: 'Honda', model: 'Amaze', year: 2019, fuelType: 'PETROL', reg: 'MH14ST7890' },
      { make: 'Maruti Suzuki', model: 'Balaner', year: 2021, fuelType: 'PETROL', reg: 'MH14UV1234' },
    ];

    const allVehicles = [hondaCity];

    for (let i = 0; i < vehicleTemplates.length; i++) {
      const v = await Vehicle.create({
        customerId: customerUsers[(i + 1) % customerUsers.length]._id,
        registrationNumber: vehicleTemplates[i].reg,
        make: vehicleTemplates[i].make,
        model: vehicleTemplates[i].model,
        year: vehicleTemplates[i].year,
        fuelType: vehicleTemplates[i].fuelType,
        mileage: 20000 + i * 8000,
        vin: `VIN908123${i}782`,
      });
      allVehicles.push(v);
    }

    // 3. Create Parts Inventory
    const partsData = [
      { partNumber: 'PART-ENG-01', name: 'Synthetic Engine Oil 5W-30 (4L)', category: 'Engine', purchasePrice: 1200, sellingPrice: 2000, currentStock: 3, minStockLevel: 10, unit: 'can' }, // LOW STOCK!
      { partNumber: 'PART-ENG-02', name: 'Oil Filter Premium', category: 'Engine', purchasePrice: 200, sellingPrice: 500, currentStock: 15, minStockLevel: 8, unit: 'pcs' },
      { partNumber: 'PART-BRK-01', name: 'Front Ceramic Brake Pads (Set)', category: 'Brakes', purchasePrice: 1500, sellingPrice: 2800, currentStock: 4, minStockLevel: 6, unit: 'set' }, // LOW STOCK!
      { partNumber: 'PART-BRK-02', name: 'Rear Brake Shoes', category: 'Brakes', purchasePrice: 900, sellingPrice: 1600, currentStock: 12, minStockLevel: 5, unit: 'set' },
      { partNumber: 'PART-FLT-01', name: 'Engine Air Filter Element', category: 'Engine', purchasePrice: 300, sellingPrice: 650, currentStock: 20, minStockLevel: 10, unit: 'pcs' },
      { partNumber: 'PART-FLT-02', name: 'AC Cabin Filter', category: 'Electrical', purchasePrice: 350, sellingPrice: 750, currentStock: 18, minStockLevel: 8, unit: 'pcs' },
      { partNumber: 'PART-ELE-01', name: '12V 45Ah Car Battery (MF)', category: 'Electrical', purchasePrice: 3200, sellingPrice: 5500, currentStock: 2, minStockLevel: 5, unit: 'pcs' }, // LOW STOCK!
      { partNumber: 'PART-ELE-02', name: 'Iridium Spark Plug Set (4pcs)', category: 'Engine', purchasePrice: 1100, sellingPrice: 2200, currentStock: 10, minStockLevel: 5, unit: 'set' },
      { partNumber: 'PART-SUS-01', name: 'Front Shock Absorber Strut', category: 'Suspension', purchasePrice: 2200, sellingPrice: 4200, currentStock: 6, minStockLevel: 4, unit: 'pcs' },
      { partNumber: 'PART-FLD-01', name: 'Dot 4 Brake Fluid (500ml)', category: 'Fluids', purchasePrice: 150, sellingPrice: 350, currentStock: 25, minStockLevel: 10, unit: 'bottle' },
      { partNumber: 'PART-FLD-02', name: 'Engine Coolant Concentrate (1L)', category: 'Fluids', purchasePrice: 220, sellingPrice: 450, currentStock: 30, minStockLevel: 10, unit: 'bottle' },
      { partNumber: 'PART-WPR-01', name: 'Frameless Wiper Blades (Pair)', category: 'General', purchasePrice: 400, sellingPrice: 900, currentStock: 14, minStockLevel: 6, unit: 'set' },
    ];

    const insertedParts = await Part.insertMany(partsData);

    // 4. Create Historical & Active Bookings and Jobs for realistic dashboard view
    // Job 1: Completed Brake Service for Creta
    const sj1 = await ServiceJob.create({
      jobNumber: 'SJ-1001',
      vehicleId: allVehicles[1]._id,
      customerId: customerUsers[1]._id,
      advisorId: advisorUser._id,
      mechanicId: mechanicUser._id,
      serviceType: 'Brake Overhaul Service',
      checkInDetails: { odometer: 28400, fuelLevelPercent: 60, existingDamages: ['Minor scratch on rear bumper'], checkInNotes: 'Squeaking brake pedal sound' },
      status: 'COMPLETED',
      statusHistory: [
        { status: 'CHECKED_IN', updatedBy: advisorUser._id, updatedByName: advisorUser.name, notes: 'Checked in' },
        { status: 'APPROVED', updatedBy: customerUsers[1]._id, updatedByName: customerUsers[1].name, notes: 'Customer approved estimate' },
        { status: 'COMPLETED', updatedBy: advisorUser._id, updatedByName: advisorUser.name, notes: 'Delivered to customer' },
      ],
    });

    const est1 = await Estimate.create({
      estimateNumber: 'EST-1001',
      serviceJobId: sj1._id,
      parts: [
        { partId: insertedParts[2]._id, partName: insertedParts[2].name, partNumber: insertedParts[2].partNumber, quantity: 1, unitPrice: 2800, totalPrice: 2800 },
        { partId: insertedParts[9]._id, partName: insertedParts[9].name, partNumber: insertedParts[9].partNumber, quantity: 1, unitPrice: 350, totalPrice: 350 },
      ],
      labour: [{ description: 'Brake Pad Replacement & Rotor Skimming', hours: 2, ratePerHour: 500, totalCost: 1000 }],
      partsSubtotal: 3150,
      labourSubtotal: 1000,
      taxPercent: 18,
      taxAmount: 747,
      discountAmount: 0,
      grandTotal: 4897,
      status: 'APPROVED',
      approvedAt: new Date(Date.now() - 86400000 * 3),
    });

    const inv1 = await Invoice.create({
      invoiceNumber: 'INV-1001',
      serviceJobId: sj1._id,
      estimateId: est1._id,
      customerId: customerUsers[1]._id,
      vehicleId: allVehicles[1]._id,
      partsSubtotal: 3150,
      labourSubtotal: 1000,
      taxPercent: 18,
      taxAmount: 747,
      discountAmount: 0,
      grandTotal: 4897,
      paymentStatus: 'PAID',
      paidAmount: 4897,
      dueAmount: 0,
    });

    await Payment.create({
      paymentNumber: 'PAY-1001',
      invoiceId: inv1._id,
      serviceJobId: sj1._id,
      customerId: customerUsers[1]._id,
      amount: 4897,
      paymentMethod: 'UPI',
      transactionRef: 'UPI-90812374612',
      status: 'SUCCESS',
    });

    // 5. System Initial Audit Logs
    await AuditLog.create([
      { userName: 'System', userRole: 'SYSTEM', action: 'DATABASE_SEEDED', entity: 'System', details: 'AutoFlow initialized with seed catalog.' },
      { userName: advisorUser.name, userRole: 'SERVICE_ADVISOR', action: 'JOB_COMPLETED', entity: 'ServiceJob', entityId: String(sj1._id), details: 'Service Job #SJ-1001 marked completed & delivered.' },
    ]);

    console.log('AutoFlow Seed Completed Successfully!');
    console.log('----------------------------------------------------');
    console.log('DEMO CREDENTIALS:');
    console.log('1. Customer: amit@autoflow.com / password123 (Honda City MH10AB1234)');
    console.log('2. Advisor:  advisor@autoflow.com / password123 (Rajesh Kumar)');
    console.log('3. Mechanic: mechanic@autoflow.com / password123 (Rahul Sharma)');
    console.log('4. Admin:    admin@autoflow.com / password123 (Vikram Singh)');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedData;
