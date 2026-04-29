import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const event = await prisma.event.findUnique({
      where: { id: 28 },
      include: { _count: { select: { tickets: true } } }
    });
    console.log('Event 28:', JSON.stringify(event, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

check();
