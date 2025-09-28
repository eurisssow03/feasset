// Script to fix TypeScript errors
import fs from 'fs';
import path from 'path';

const filesToFix = [
  'src/routes/users.ts',
  'src/routes/units.ts', 
  'src/routes/guests.ts',
  'src/routes/reservations.ts',
  'src/routes/deposits.ts',
  'src/routes/cleanings.ts',
  'src/routes/finance.ts',
  'src/routes/calendar.ts',
  'src/controllers/UserController.ts',
  'src/controllers/UnitController.ts',
  'src/controllers/GuestController.ts',
  'src/controllers/ReservationController.ts',
  'src/controllers/DepositController.ts',
  'src/controllers/CleaningController.ts',
  'src/controllers/FinanceController.ts',
  'src/controllers/CalendarController.ts',
  'src/controllers/UploadController.ts',
  'src/scripts/seed.ts'
];

const replacements = [
  {
    from: "import { PrismaClient, Role } from '@prisma/client';",
    to: "import { PrismaClient } from '@prisma/client';\nimport { Role } from '../types';"
  },
  {
    from: "import { PrismaClient, ReservationStatus } from '@prisma/client';",
    to: "import { PrismaClient } from '@prisma/client';\nimport { ReservationStatus } from '../types';"
  },
  {
    from: "import { PrismaClient, DepositStatus } from '@prisma/client';",
    to: "import { PrismaClient } from '@prisma/client';\nimport { DepositStatus } from '../types';"
  },
  {
    from: "import { PrismaClient, CleaningStatus } from '@prisma/client';",
    to: "import { PrismaClient } from '@prisma/client';\nimport { CleaningStatus } from '../types';"
  },
  {
    from: "import { Role } from '@prisma/client';",
    to: "import { Role } from '../types';"
  },
  {
    from: "import { ReservationStatus } from '@prisma/client';",
    to: "import { ReservationStatus } from '../types';"
  },
  {
    from: "import { DepositStatus } from '@prisma/client';",
    to: "import { DepositStatus } from '../types';"
  },
  {
    from: "import { CleaningStatus } from '@prisma/client';",
    to: "import { CleaningStatus } from '../types';"
  }
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    replacements.forEach(replacement => {
      content = content.replace(replacement.from, replacement.to);
    });
    
    // Fix async function return types
    content = content.replace(/async (\w+)\([^)]*\): Promise<[^>]*> \{/g, 'async $1($2): Promise<void> {');
    content = content.replace(/async (\w+)\([^)]*\) \{/g, 'async $1($2): Promise<void> {');
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed ${filePath}`);
  }
});

console.log('TypeScript fixes applied!');
