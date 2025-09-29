import { PrismaClient } from '@prisma/client';
import { Role } from '../types';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@homestay.com';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create sample users
  const users = [
    {
      name: 'Finance Manager',
      email: 'finance@homestay.com',
      password: 'finance123',
      role: 'FINANCE',
    },
    {
      name: 'John Cleaner',
      email: 'cleaner@homestay.com',
      password: 'cleaner123',
      role: 'CLEANER',
    },
    {
      name: 'Jane Agent',
      email: 'agent@homestay.com',
      password: 'agent123',
      role: Role.AGENT,
    },
  ];

  for (const userData of users) {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        name: userData.name,
        email: userData.email,
        passwordHash,
        role: userData.role as Role,
        isActive: true,
      },
    });

    console.log(`✅ ${userData.role} user created:`, userData.email);
  }

  // Create sample units
  const units = [
    {
      name: 'Ocean View Villa',
      code: 'OVV001',
      address: '123 Beach Road, Coastal City',
      active: true,
    },
    {
      name: 'Mountain Cabin',
      code: 'MC002',
      address: '456 Forest Lane, Mountain Town',
      active: true,
    },
    {
      name: 'City Apartment',
      code: 'CA003',
      address: '789 Downtown Street, Metro City',
      active: true,
    },
  ];

  for (const unitData of units) {
    await prisma.unit.upsert({
      where: { code: unitData.code },
      update: {},
      create: unitData,
    });

    console.log(`✅ Unit created:`, unitData.name);
  }

  // Create sample guests
  const guests = [
    {
      fullName: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+1234567890',
      notes: 'Prefers ground floor',
    },
    {
      fullName: 'Bob Smith',
      email: 'bob@example.com',
      phone: '+0987654321',
      notes: 'Allergic to pets',
    },
    {
      fullName: 'Carol Davis',
      email: 'carol@example.com',
      phone: '+1122334455',
      notes: 'Early check-in requested',
    },
  ];

  for (const guestData of guests) {
    const existingGuest = await prisma.guest.findFirst({
      where: { email: guestData.email },
    });

    if (!existingGuest) {
      await prisma.guest.create({
        data: guestData,
      });
      console.log(`✅ Guest created:`, guestData.fullName);
    } else {
      console.log(`⚠️ Guest already exists:`, guestData.fullName);
    }
  }

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Login credentials:');
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log('Finance: finance@homestay.com / finance123');
  console.log('Cleaner: cleaner@homestay.com / cleaner123');
  console.log('Agent: agent@homestay.com / agent123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
