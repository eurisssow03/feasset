const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@homestay.com' },
    update: {},
    create: {
      name: 'Homestay Admin',
      email: 'admin@homestay.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create sample locations
  let location1, location2;
  
  try {
    location1 = await prisma.location.create({
      data: {
        name: 'Downtown Apartment Complex',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        country: 'US',
        postalCode: '10001',
        phone: '+1 (555) 123-4567',
        email: 'downtown@homestay.com',
        description: 'Modern apartment complex in the heart of downtown',
        isActive: true,
      },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      // Location already exists, find it
      location1 = await prisma.location.findUnique({
        where: { name: 'Downtown Apartment Complex' }
      });
    } else {
      throw error;
    }
  }

  try {
    location2 = await prisma.location.create({
      data: {
        name: 'Riverside Villa',
        address: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        country: 'US',
        postalCode: '90210',
        phone: '+1 (555) 987-6543',
        email: 'riverside@homestay.com',
        description: 'Luxury villa with river views',
        isActive: true,
      },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      // Location already exists, find it
      location2 = await prisma.location.findUnique({
        where: { name: 'Riverside Villa' }
      });
    } else {
      throw error;
    }
  }

  console.log('✅ Created sample locations');

  // Create sample units
  const unit1 = await prisma.unit.upsert({
    where: { code: 'UNIT-001' },
    update: {},
    create: {
      locationId: location1.id,
      name: 'Deluxe Room 1',
      code: 'UNIT-001',
      address: '123 Main Street, City Center',
      active: true,
    },
  });

  const unit2 = await prisma.unit.upsert({
    where: { code: 'UNIT-002' },
    update: {},
    create: {
      locationId: location2.id,
      name: 'Standard Room 1',
      code: 'UNIT-002',
      address: '456 Oak Avenue, Downtown',
      active: true,
    },
  });

  console.log('✅ Created sample units');

  // Create sample guest
  const guest1 = await prisma.guest.create({
    data: {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      notes: 'Regular customer',
    },
  });

  console.log('✅ Created sample guest');

  // Create sample reservation
  const reservation1 = await prisma.reservation.create({
    data: {
      guestId: guest1.id,
      unitId: unit1.id,
      checkIn: new Date('2024-01-15'),
      checkOut: new Date('2024-01-18'),
      nightlyRate: 100.00,
      totalAmount: 300.00,
      cleaningFee: 25.00,
      depositRequired: true,
      depositAmount: 100.00,
      depositRefundAmt: 0.00,
      status: 'CONFIRMED',
      specialRequests: 'Weekend stay',
    },
  });

  console.log('✅ Created sample reservation');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
