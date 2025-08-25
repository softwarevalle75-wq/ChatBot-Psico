import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await import('./roles.js');
  } finally {
    await prisma.$disconnect();
  }
}

main();