import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting non-destructive Studio/Dancer seeding...");

  // 1. Find existing users to attach data to
  const studios = await prisma.user.findMany({ where: { role: "STUDIO" } });
  const agencies = await prisma.user.findMany({ where: { role: "AGENCY" } });
  const dancers = await prisma.user.findMany({ where: { role: "DANCER" } });

  if (studios.length === 0 || dancers.length === 0) {
    console.log("Not enough users to seed studio data. Please run main seed first.");
    return;
  }

  const studio = studios[0];
  const agency = agencies.length > 0 ? agencies[0] : null;
  const dancer1 = dancers[0];
  const dancer2 = dancers.length > 1 ? dancers[1] : dancers[0];

  // --- Seed Weekly Classes ---
  console.log(`Seeding classes for Studio: ${studio.name || studio.email}`);
  
  await prisma.weeklyClass.upsert({
    where: { id: 1 },
    update: { title: "Advanced Choreography", teacherId: dancer1.id, studioId: studio.id },
    create: {
      id: 1,
      studioId: studio.id,
      title: "Advanced Choreography",
      dayOfWeek: "MONDAY",
      startTime: "18:00",
      endTime: "19:30",
      style: "Hip Hop",
      level: "ADVANCED",
      teacherName: null,
      teacherId: dancer1.id,
      capacity: 30
    }
  });

  await prisma.weeklyClass.upsert({
    where: { id: 2 },
    update: { title: "Beginner Heels", studioId: studio.id },
    create: {
      id: 2,
      studioId: studio.id,
      title: "Beginner Heels",
      dayOfWeek: "TUESDAY",
      startTime: "19:00",
      endTime: "20:30",
      style: "Heels",
      level: "BEGINNER",
      teacherName: "Guest Teacher Sarah",
      teacherId: null,
      capacity: 25
    }
  });

  // --- Seed Memberships ---
  console.log("Seeding memberships...");
  await prisma.membershipTier.upsert({
    where: { id: 1 },
    update: { name: "Basic Month", studioId: studio.id },
    create: {
      id: 1,
      studioId: studio.id,
      name: "Basic Month",
      description: "4 classes per month",
      priceCents: 4500, // 45.00
      classLimit: 4,
      durationDays: 30,
      isActive: true
    }
  });

  await prisma.membershipTier.upsert({
    where: { id: 2 },
    update: { name: "Unlimited Month", studioId: studio.id },
    create: {
      id: 2,
      studioId: studio.id,
      name: "Unlimited Month",
      description: "Access to all open classes",
      priceCents: 12000, // 120.00
      classLimit: null,
      durationDays: 30,
      isActive: true
    }
  });

  // --- Seed Studio Team ---
  console.log("Seeding studio team...");
  // Use unique compound or search first
  const existingTeam = await prisma.studioTeamMember.findFirst({
    where: { studioId: studio.id, userId: dancer1.id }
  });
  if (!existingTeam) {
    await prisma.studioTeamMember.create({
      data: {
        studioId: studio.id,
        userId: dancer1.id,
        role: "CHOREOGRAPHER"
      }
    });
  }

  // --- Seed Collaboration ---
  if (agency) {
    console.log("Seeding collaboration...");
    await prisma.collaboration.upsert({
      where: {
        studioId_agencyId: { studioId: studio.id, agencyId: agency.id }
      },
      update: {},
      create: {
        studioId: studio.id,
        agencyId: agency.id,
        description: "Official Talent Partnership"
      }
    });
  }

  // --- Seed Dancer CV ---
  console.log(`Seeding CV for Dancer: ${dancer1.name || dancer1.email}`);
  await prisma.cvEntry.upsert({
    where: { id: 1 },
    update: { title: "Summer Dance Intensive 2023", userId: dancer1.id },
    create: {
      id: 1,
      userId: dancer1.id,
      type: "TRAINING",
      title: "Summer Dance Intensive 2023",
      description: "Completed 40-hour intensive program.",
      startDate: new Date("2023-06-01T00:00:00Z"),
      endDate: new Date("2023-06-15T00:00:00Z"),
      choreographer: "John Doe",
      taggedStudioId: studio.id
    }
  });

  await prisma.cvEntry.upsert({
    where: { id: 2 },
    update: { title: "World of Dance Finals", userId: dancer1.id },
    create: {
      id: 2,
      userId: dancer1.id,
      type: "COMPETITION",
      title: "World of Dance Finals",
      description: "1st place in Mega Crew division.",
      startDate: new Date("2024-08-10T00:00:00Z"),
      endDate: new Date("2024-08-12T00:00:00Z"),
      choreographer: "Jane Smith",
      taggedAgencyId: agency ? agency.id : null
    }
  });

  console.log("Demo data seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
