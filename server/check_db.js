import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  const eventCount = await prisma.event.count();
  console.log(`Verification: ${userCount} Users, ${eventCount} Events.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
