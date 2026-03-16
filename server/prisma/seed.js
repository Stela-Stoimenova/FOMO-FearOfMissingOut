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

// Category-aware image pools — images matched by dance style / event type
const CATEGORY_IMAGES = {
    ballet: [
        "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1508807526345-15e9b5f4ea2b?w=800&h=500&fit=crop",
    ],
    contemporary: [
        "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1508807526345-15e9b5f4ea2b?w=800&h=500&fit=crop",
    ],
    hiphop: [
        "https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=500&fit=crop",
    ],
    breaking: [
        "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=500&fit=crop",
    ],
    heels: [
        "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=500&fit=crop",
    ],
    festival: [
        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=500&fit=crop",
    ],
    workshop: [
        "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&h=500&fit=crop",
    ],
    battle: [
        "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=500&fit=crop",
    ],
    default: [
        "https://images.unsplash.com/photo-1468359601543-843bfaef291a?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&h=500&fit=crop",
    ],
};

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Pick an image based on the event style and title keywords
function pickImageForEvent(style, title) {
    const key = style.toLowerCase().replace(/\s+/g, "");
    const t = title.toLowerCase();
    if (t.includes("festival") || t.includes("retreat")) return pickRandom(CATEGORY_IMAGES.festival);
    if (t.includes("battle")) return pickRandom(CATEGORY_IMAGES.battle);
    if (t.includes("workshop") || t.includes("masterclass") || t.includes("intensive") || t.includes("foundations")) return pickRandom(CATEGORY_IMAGES.workshop);
    if (key === "ballet") return pickRandom(CATEGORY_IMAGES.ballet);
    if (key === "contemporary") return pickRandom(CATEGORY_IMAGES.contemporary);
    if (key === "hiphop") return pickRandom(CATEGORY_IMAGES.hiphop);
    if (key === "breaking") return pickRandom(CATEGORY_IMAGES.breaking);
    if (key === "heels" || key === "commercial") return pickRandom(CATEGORY_IMAGES.heels);
    if (key === "house" || key === "popping") return pickRandom(CATEGORY_IMAGES.hiphop);
    return pickRandom(CATEGORY_IMAGES.default);
}

// Realistic event title templates for variety
const EVENT_TEMPLATES = [
    { title: "{style} Masterclass with International Guest", desc: "Join an exclusive masterclass with a world-renowned {style} choreographer. Learn signature moves, refine your technique, and connect with dancers from across Europe." },
    { title: "{city} Street Dance Battle", desc: "The ultimate street dance battle returns to {city}! Bring your best moves and compete against top dancers from the region. Judges, prizes, and pure energy." },
    { title: "Urban Movement Festival {city}", desc: "A 2-day celebration of urban dance culture in the heart of {city}. Workshops, performances, battles, and networking with the best in the scene." },
    { title: "{style} Intensive — Advanced Choreography", desc: "Push your {style} skills to the next level in this intensive choreography session. Designed for intermediate to advanced dancers ready to grow." },
    { title: "Open Floor Sessions: {style} Night", desc: "Join our weekly open floor {style} night in {city}. All levels welcome. Music, movement, and community under one roof." },
    { title: "{city} Dance Week — {style} Edition", desc: "A week-long dance celebration featuring daily {style} workshops, showcases, and social events. The dancer community of {city} comes together!" },
    { title: "Pro Auditions: {style} Company", desc: "Open auditions for an upcoming {style} dance project in {city}. Professional dancers with 3+ years experience are encouraged to apply. Paid positions available." },
    { title: "Foundations of {style}", desc: "Perfect for beginners and those looking to revisit the basics. This workshop covers core {style} techniques, musicality, and body control." },
    { title: "{style} x {style2} Fusion Workshop", desc: "Explore the intersection of {style} and {style2} in this innovative fusion workshop. Break boundaries and discover new movement possibilities." },
    { title: "Summer Dance Retreat — {city}", desc: "Escape to {city} for a 3-day immersive dance retreat. Daily classes in multiple styles, wellness sessions, and evening showcases by the best local and international talent." },
];

// Dancer profile seed data
const DANCER_PROFILES = [
    { name: "Maria Ivanova", bio: "Professional hip-hop and commercial dancer from Sofia. 8+ years of stage and video experience.", city: "Sofia", styles: ["Hip Hop", "Commercial"], level: "Professional", links: ["https://youtube.com/@maria_dance", "https://instagram.com/maria.moves"] },
    { name: "Alex Petrov", bio: "Contemporary and ballet trained dancer. Passionate about fusion choreography.", city: "Plovdiv", styles: ["Contemporary", "Ballet"], level: "Advanced", links: ["https://vimeo.com/alexpetrov"] },
    { name: "Nina Todorova", bio: "Breaking and popping specialist. Battle champion 2024.", city: "Varna", styles: ["Breaking", "Popping"], level: "Professional", links: ["https://youtube.com/@nina_bboy"] },
    { name: "Stefan Georgiev", bio: "Heels and commercial choreographer. Open class instructor at Flow Academy.", city: "Sofia", styles: ["Heels", "Commercial"], level: "Advanced", links: ["https://instagram.com/stefan.heels"] },
    { name: "Elena Dimitrova", bio: "House and hip-hop freestyle dancer exploring movement culture.", city: "Berlin", styles: ["House", "Hip Hop"], level: "Intermediate", links: [] },
    { name: "Dimitar Kolev", bio: "Young aspiring dancer training in contemporary and ballet.", city: "Sofia", styles: ["Contemporary", "Ballet"], level: "Beginner", links: [] },
    { name: "Yana Stoilova", bio: "Festival performer and workshop instructor across Europe.", city: "Vienna", styles: ["Hip Hop", "Heels", "Commercial"], level: "Professional", links: ["https://youtube.com/@yana_dance", "https://yanastoilova.com"] },
    { name: "Viktor Marinov", bio: "Popping and animation artist. Creates mesmerizing visual performances.", city: "Budapest", styles: ["Popping", "House"], level: "Advanced", links: ["https://vimeo.com/viktorpops"] },
    { name: "Kalina Hristova", bio: "Training intensively in contemporary and looking to go pro.", city: "Paris", styles: ["Contemporary"], level: "Intermediate", links: [] },
    { name: "Boyan Atanasov", bio: "Breaking enthusiast and battle organizer. Community builder.", city: "Amsterdam", styles: ["Breaking", "Hip Hop"], level: "Advanced", links: ["https://instagram.com/boyan.breaks"] },
];

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

    // Create 10 Dancers with realistic profiles
    for (let i = 1; i <= 10; i++) {
        const profile = DANCER_PROFILES[i - 1];

        // Prepare dummy portfolio items
        const dummyPortfolio = [
            { type: "PHOTO", url: "https://images.unsplash.com/photo-1547153760-18fc86324498?w=500&h=500&fit=crop", title: "Photoshoot", description: "Studio session vibes" },
            { type: "PHOTO", url: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=500&h=500&fit=crop", title: "Live Show", description: "Performing at the main stage" },
            { type: "VIDEO", url: profile.links[0] || "https://vimeo.com/123456789", title: "Concept Video", description: "My latest choreography piece" }
        ];

        const user = await prisma.user.create({
            data: {
                email: `dancer${i}@demo.com`,
                password: passwordHash,
                name: profile.name,
                role: "DANCER",
                bio: profile.bio,
                city: profile.city,
                danceStyles: profile.styles,
                experienceLevel: profile.level,
                portfolioLinks: profile.links,
                loyaltyAccount: {
                    create: { points: Math.floor(Math.random() * 500) }
                },
                portfolioItems: {
                    create: dummyPortfolio
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
        const style2 = STYLES.filter(s => s !== style)[Math.floor(Math.random() * (STYLES.length - 1))];
        const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];

        const start = randomDateNextDays();
        const end = new Date(start.getTime() + (Math.floor(Math.random() * 4) + 2) * 60 * 60 * 1000);

        const title = template.title.replace(/\{style\}/g, style).replace(/\{style2\}/g, style2).replace(/\{city\}/g, city.name);
        const description = template.desc.replace(/\{style\}/g, style.toLowerCase()).replace(/\{style2\}/g, style2.toLowerCase()).replace(/\{city\}/g, city.name);
        const imageUrl = pickImageForEvent(style, title);

        const priceCents = Math.floor(Math.random() * 50 + 10) * 100;
        const capacity = Math.floor(Math.random() * 80) + 20;

        await prisma.event.create({
            data: {
                title,
                description,
                imageUrl,
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
