import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const CITIES = [
    { name: "Sofia", lat: 42.6977, lng: 23.3219 },
    { name: "Plovdiv", lat: 42.1439, lng: 24.7496 },
    { name: "Varna", lat: 43.2141, lng: 27.9147 },
    { name: "Bucharest", lat: 44.4268, lng: 26.1025 },
    { name: "Cluj-Napoca", lat: 46.7712, lng: 23.6236 },
    { name: "Belgrade", lat: 44.7866, lng: 20.4489 },
    { name: "Vienna", lat: 48.2082, lng: 16.3738 },
    { name: "Budapest", lat: 47.4979, lng: 19.0402 },
    { name: "Berlin", lat: 52.5200, lng: 13.4050 },
    { name: "Paris", lat: 48.8566, lng: 2.3522 },
    { name: "Milan", lat: 45.4642, lng: 9.1900 },
    { name: "Amsterdam", lat: 52.3676, lng: 4.9041 },
    { name: "Madrid", lat: 40.4168, lng: -3.7038 },
];

const STYLES = ["Hip Hop", "Contemporary", "Heels", "Ballet", "Breaking", "House", "Popping", "Commercial"];
const TYPES = ["Workshop", "Audition", "Open Class", "Festival", "Battle", "Intensive"];

// Helper to jitter coordinates slightly so events aren't exactly on top of each other
function jitterCoord(coord) {
    const jitter = (Math.random() - 0.5) * 0.05; // Roughly +/- 2-5km
    return coord + jitter;
}

// Generate a random date between now and X days in the future
function randomDateNextDays(maxDays = 180) {
    const now = new Date();
    const future = new Date(now.getTime() + Math.random() * maxDays * 24 * 60 * 60 * 1000);
    return future;
}

async function main() {
    console.log(`Starting database seed...`);

    // 1. Clean Database (Respecting relations)
    console.log(`Clearing existing data...`);
    await prisma.transaction.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.loyaltyTransaction.deleteMany();
    await prisma.loyaltyAccount.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    // 2. Setup standard passwords
    const passwordHash = await bcrypt.hash("password123", 10);

    // 3. Create Users
    console.log(`Creating users...`);
    const users = [];

    // Create 10 Dancers
    for (let i = 1; i <= 10; i++) {
        const user = await prisma.user.create({
            data: {
                email: `dancer${i}@demo.com`,
                password: passwordHash,
                name: `Demo Dancer ${i}`,
                role: "DANCER",
                loyaltyAccount: {
                    create: { points: Math.floor(Math.random() * 500) }
                }
            }
        });
        users.push(user);
    }

    // Create 5 Studios
    const studioNames = ["Movement Lifestyle", "Millennium Dance Complex", "Base Studios", "Urban Dance Camp", "Flow Academy"];
    for (let i = 0; i < 5; i++) {
        const user = await prisma.user.create({
            data: {
                email: `studio${i + 1}@demo.com`,
                password: passwordHash,
                name: studioNames[i],
                role: "STUDIO",
            }
        });
        users.push(user);
    }

    // Create 5 Agencies
    const agencyNames = ["Clear Talent Group", "Bloc Agency", "MSA Agency", "Go 2 Talent", "AMCK Dance"];
    for (let i = 0; i < 5; i++) {
        const user = await prisma.user.create({
            data: {
                email: `agency${i + 1}@demo.com`,
                password: passwordHash,
                name: agencyNames[i],
                role: "AGENCY",
            }
        });
        users.push(user);
    }

    // 4. Create Events
    console.log(`Creating massive event payload across Europe...`);

    // Only fetch users capable of creating events
    const creators = users.filter(u => u.role === "STUDIO" || u.role === "AGENCY");

    let eventCount = 0;

    for (let i = 0; i < 90; i++) {
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];
        const creator = creators[Math.floor(Math.random() * creators.length)];

        const style = STYLES[Math.floor(Math.random() * STYLES.length)];
        const type = TYPES[Math.floor(Math.random() * TYPES.length)];

        const start = randomDateNextDays();
        // End date is 2 to 6 hours after start
        const end = new Date(start.getTime() + (Math.floor(Math.random() * 4) + 2) * 60 * 60 * 1000);

        const title = `${style} ${type} - ${city.name} Edition`;
        const description = `Join us at ${creator.name} for an incredible ${style} ${type.toLowerCase()}. Elevate your skills, connect with the community in ${city.name}, and push your boundaries. Open to all levels determined to grow!`;

        const priceCents = Math.floor(Math.random() * 50 + 10) * 100; // between €10.00 and €60.00
        const capacity = Math.floor(Math.random() * 80) + 20; // 20 to 100 people

        await prisma.event.create({
            data: {
                title,
                description,
                location: city.name,
                startAt: start,
                endAt: end,
                priceCents,
                capacity,
                latitude: jitterCoord(city.lat),
                longitude: jitterCoord(city.lng),
                creatorId: creator.id
            }
        });
        eventCount++;
    }

    console.log(`Successfully created ${users.length} Users and ${eventCount} Events.`);
    console.log(`Seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
