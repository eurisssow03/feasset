const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production seed...');

  try {
    // Create admin user if it doesn't exist
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@homestay.com' }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@homestay.com',
          password: hashedPassword,
          fullName: 'System Administrator',
          role: 'ADMIN',
          isActive: true,
        },
      });

      console.log('✅ Created admin user:', adminUser.email);
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Create sample locations
    let location1, location2;

    try {
      location1 = await prisma.location.create({
        data: {
          name: 'Downtown Office',
          isActive: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        location1 = await prisma.location.findUnique({
          where: { name: 'Downtown Office' }
        });
      } else {
        throw error;
      }
    }

    try {
      location2 = await prisma.location.create({
        data: {
          name: 'Main Building',
          isActive: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        location2 = await prisma.location.findUnique({
          where: { name: 'Main Building' }
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
        cleaningCost: 50.00,
        washingMachine: true,
        airConditioning: true,
        wifi: true,
        kitchen: true,
        parking: true,
        balcony: true,
        pool: false,
        gym: false,
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
        cleaningCost: 30.00,
        washingMachine: false,
        airConditioning: true,
        wifi: true,
        kitchen: false,
        parking: true,
        balcony: false,
        pool: false,
        gym: false,
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
        phone: '+1 (555) 123-4567',
        address: '123 Main Street, City, State 12345',
        isActive: true,
      },
    });

    console.log('✅ Created sample guest');

    console.log('🎉 Production seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during production seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
