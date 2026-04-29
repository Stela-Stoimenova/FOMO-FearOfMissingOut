import "dotenv/config";
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  const eventCount = await prisma.event.count();
  const classCount = await prisma.weeklyClass.count();
  const rosterCount = await prisma.agencyRoster.count();
  console.log(`Verification: ${userCount} Users, ${eventCount} Events, ${classCount} Classes, ${rosterCount} Roster entries.`);
}


main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
