import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

  // Create sample units
  const unit1 = await prisma.unit.upsert({
    where: { code: 'UNIT-001' },
    update: {},
    create: {
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
      name: 'Standard Room 1',
      code: 'UNIT-002',
      address: '456 Oak Avenue, Downtown',
      active: true,
    },
  });

  console.log('✅ Created sample units');

  // Create sample guest
  const guest1 = await prisma.guest.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      address: '789 Pine Street, Suburb',
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
      totalAmount: 300.00,
      cleaningFee: 25.00,
      depositAmount: 100.00,
      depositRefundAmt: 0.00,
      status: 'CONFIRMED',
      notes: 'Weekend stay',
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
