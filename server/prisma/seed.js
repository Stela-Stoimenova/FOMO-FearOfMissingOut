/*
  Prisma Seed Script
  Run with: npm run seed
  Idempotent - safe to re-run, will not create duplicates.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ─── Users ────────────────────────────────────────────────────────────────────

const USERS = [
    {
        email: "dancer@fomo.dev",
        password: "dancer123",
        name: "Alex Ivanov",
        role: "DANCER",
    },
    {
        email: "studio@fomo.dev",
        password: "studio123",
        name: "Pulse Dance Studio",
        role: "STUDIO",
    },
    {
        email: "agency@fomo.dev",
        password: "agency123",
        name: "BeatBox Agency",
        role: "AGENCY",
    },
];

// ─── Events ───────────────────────────────────────────────────────────────────

// Events are tied to the studio and agency users by array index (0=DANCER, 1=STUDIO, 2=AGENCY)
// creatorIndex refers to the USERS array above
const EVENTS = [
    // ── Sofia ──────────────────────────────────────────────────────────────────
    {
        title: "Urban Salsa Night",
        description: "A vibrant salsa social with live DJ and open floor dancing.",
        location: "Sofia, Bulgaria",
        startAt: new Date("2026-04-10T19:00:00Z"),
        endAt: new Date("2026-04-10T23:00:00Z"),
        priceCents: 1500,
        capacity: 80,
        latitude: 42.6977,
        longitude: 23.3219,
        creatorIndex: 1, // STUDIO
    },
    {
        title: "Hip-Hop Masterclass",
        description: "Intensive 3-hour workshop with international choreographer.",
        location: "Sofia, Bulgaria",
        startAt: new Date("2026-04-15T10:00:00Z"),
        endAt: new Date("2026-04-15T13:00:00Z"),
        priceCents: 3500,
        capacity: 30,
        latitude: 42.7000,
        longitude: 23.3300,
        creatorIndex: 2, // AGENCY
    },
    {
        title: "Bachata Fusion Social",
        description: "Monthly bachata social open to all levels. Refreshments included.",
        location: "Sofia, Bulgaria",
        startAt: new Date("2026-04-20T20:00:00Z"),
        endAt: new Date("2026-04-21T00:00:00Z"),
        priceCents: 800,
        capacity: 120,
        latitude: 42.6950,
        longitude: 23.3280,
        creatorIndex: 1, // STUDIO
    },
    {
        title: "Contemporary Dance Intensive",
        description: "Two-day contemporary workshop exploring movement and expression.",
        location: "Sofia, Bulgaria",
        startAt: new Date("2026-05-01T09:00:00Z"),
        endAt: new Date("2026-05-02T17:00:00Z"),
        priceCents: 7500,
        capacity: 20,
        latitude: 42.6920,
        longitude: 23.3200,
        creatorIndex: 2, // AGENCY
    },
    // ── Plovdiv ────────────────────────────────────────────────────────────────
    {
        title: "Kizomba & Tarraxinha Night",
        description: "The best kizomba social in Plovdiv – great music, great vibes.",
        location: "Plovdiv, Bulgaria",
        startAt: new Date("2026-04-12T20:00:00Z"),
        endAt: new Date("2026-04-13T01:00:00Z"),
        priceCents: 1000,
        capacity: 60,
        latitude: 42.1354,
        longitude: 24.7453,
        creatorIndex: 1, // STUDIO
    },
    {
        title: "Street Dance Battle",
        description: "Open battle in all styles – 1v1 and crew categories. Cash prizes.",
        location: "Plovdiv, Bulgaria",
        startAt: new Date("2026-04-25T14:00:00Z"),
        endAt: new Date("2026-04-25T20:00:00Z"),
        priceCents: 500,
        capacity: 200,
        latitude: 42.1430,
        longitude: 24.7490,
        creatorIndex: 2, // AGENCY
    },
    {
        title: "Zouk Weekend Retreat",
        description: "Two days of Brazilian Zouk workshops and socials in Plovdiv.",
        location: "Plovdiv, Bulgaria",
        startAt: new Date("2026-05-08T18:00:00Z"),
        endAt: new Date("2026-05-10T14:00:00Z"),
        priceCents: 12000,
        capacity: 40,
        latitude: 42.1380,
        longitude: 24.7420,
        creatorIndex: 1, // STUDIO
    },
    // ── Varna ──────────────────────────────────────────────────────────────────
    {
        title: "Salsa by the Sea",
        description: "Open-air salsa evening on Varna's Beach Boulevard.",
        location: "Varna, Bulgaria",
        startAt: new Date("2026-06-05T18:00:00Z"),
        endAt: new Date("2026-06-05T23:00:00Z"),
        priceCents: 1200,
        capacity: 150,
        latitude: 43.2141,
        longitude: 27.9147,
        creatorIndex: 2, // AGENCY
    },
    {
        title: "Ballet for Adults – Beginner Course",
        description: "6-week beginner ballet course for adults, starting June.",
        location: "Varna, Bulgaria",
        startAt: new Date("2026-06-10T18:00:00Z"),
        endAt: new Date("2026-06-10T19:30:00Z"),
        priceCents: 4500,
        capacity: 15,
        latitude: 43.2050,
        longitude: 27.9100,
        creatorIndex: 1, // STUDIO
    },
    {
        title: "Summer Dance Festival",
        description: "3-day international dance festival with workshops, shows, and socials.",
        location: "Varna, Bulgaria",
        startAt: new Date("2026-07-18T10:00:00Z"),
        endAt: new Date("2026-07-20T22:00:00Z"),
        priceCents: 18000,
        capacity: 300,
        latitude: 43.2200,
        longitude: 27.9200,
        creatorIndex: 2, // AGENCY
    },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log("🌱 Seeding database...\n");

    // Upsert users (idempotent by email)
    const createdUsers = [];
    for (const u of USERS) {
        const hashed = await bcrypt.hash(u.password, 10);
        const user = await prisma.user.upsert({
            where: { email: u.email },
            create: { email: u.email, password: hashed, name: u.name, role: u.role },
            update: { name: u.name, role: u.role }, // don't re-hash password on update
        });
        createdUsers.push(user);
        console.log(`  ✓ User [${user.role}] ${user.email}`);
    }

    console.log("");

    // Create events (idempotent by title + creatorId)
    let created = 0;
    let skipped = 0;
    for (const e of EVENTS) {
        const creatorId = createdUsers[e.creatorIndex].id;

        const existing = await prisma.event.findFirst({
            where: { title: e.title, creatorId },
        });

        if (existing) {
            skipped++;
            continue;
        }

        await prisma.event.create({
            data: {
                title: e.title,
                description: e.description ?? null,
                location: e.location,
                startAt: e.startAt,
                endAt: e.endAt ?? null,
                priceCents: e.priceCents,
                capacity: e.capacity ?? null,
                latitude: e.latitude ?? null,
                longitude: e.longitude ?? null,
                creatorId,
            },
        });
        console.log(`  ✓ Event  "${e.title}" (${e.location})`);
        created++;
    }

    if (skipped > 0) {
        console.log(`\n  ↩  ${skipped} event(s) already existed – skipped.`);
    }

    console.log(`\nDone! ${createdUsers.length} users, ${created} new events seeded.\n`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  DANCER  → dancer@fomo.dev   / dancer123");
    console.log("  STUDIO  → studio@fomo.dev   / studio123");
    console.log("  AGENCY  → agency@fomo.dev   / agency123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
    .catch((e) => {
        console.error("Seed failed:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
