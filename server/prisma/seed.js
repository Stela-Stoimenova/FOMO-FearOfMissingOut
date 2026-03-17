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

// ─── Category-aware image pools ─────────────────────────────────────────────
// Hand-picked Unsplash photos. Every ID verified to match the dance genre.
const CATEGORY_IMAGES = {
    ballet: [
        // Ballerina en pointe, classical studio
        "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&h=500&fit=crop",
        // Ballet dancer mid-leap on stage
        "https://images.unsplash.com/photo-1508807526345-15e9b5f4ea2b?w=800&h=500&fit=crop",
        // Ballet shoes / barre close-up
        "https://images.unsplash.com/photo-1519925610903-381054cc2a1c?w=800&h=500&fit=crop",
    ],
    contemporary: [
        // Dancer in flowing fabric, expressive movement
        "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=800&h=500&fit=crop",
        // Contemporary dancer mid-air in studio
        "https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&h=500&fit=crop",
        // Modern dance floor work
        "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=800&h=500&fit=crop",
    ],
    hiphop: [
        // Street dancers in urban setting
        "https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&h=500&fit=crop",
        // Dancer in streetwear, dynamic pose
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=500&fit=crop",
        // DJ and dancers at hip-hop event
        "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=500&fit=crop",
    ],
    breaking: [
        // B-boy freeze on concrete
        "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=500&fit=crop",
        // Breakdance battle circle
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=500&fit=crop",
        // Street dance energy
        "https://images.unsplash.com/photo-1509670572056-12e53e88819d?w=800&h=500&fit=crop",
    ],
    heels: [
        // Heels dancer in studio mirror
        "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&h=500&fit=crop",
        // Stage performance spotlight
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop",
        // Concert / performance energy
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=500&fit=crop",
    ],
    festival: [
        // Large crowd at festival
        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop",
        // Stage lights and audience 
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=500&fit=crop",
        // Crowd with hands up
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=500&fit=crop",
        // Festival atmosphere
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=500&fit=crop",
    ],
    workshop: [
        // Dance studio class in session
        "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=800&h=500&fit=crop",
        // Group learning choreography
        "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&h=500&fit=crop",
        // Mirror studio with dancers
        "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=800&h=500&fit=crop",
    ],
    battle: [
        // Dance battle circle, energy
        "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=500&fit=crop",
        // Stage / competition setup
        "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=500&fit=crop",
        // Crowd watching performance
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=500&fit=crop",
    ],
    default: [
        // Concert silhouette
        "https://images.unsplash.com/photo-1468359601543-843bfaef291a?w=800&h=500&fit=crop",
        // Music / movement
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=500&fit=crop",
        // Neon stage lights
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=500&fit=crop",
        // Dance studio
        "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=800&h=500&fit=crop",
    ],
};

// ─── Avatar image pools (Unsplash portraits) ────────────────────────────────
const DANCER_AVATARS = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face",
];

const STUDIO_AVATARS = [
    "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1547153760-18fc86324498?w=200&h=200&fit=crop",
];

const AGENCY_AVATARS = [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=200&h=200&fit=crop",
];

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

// ─── Dancer profile seed data ──────────────────────────────────────────────
const DANCER_PROFILES = [
    { name: "Lucia Fernandez", bio: "Professional hip-hop and commercial dancer from Madrid. 8+ years of stage, music video, and live concert experience across Spain and Latin America.", city: "Madrid", styles: ["Hip Hop", "Commercial"], level: "Professional", links: ["https://youtube.com/@lucia_dance", "https://instagram.com/lucia.moves"] },
    { name: "Alexandre Morel", bio: "Contemporary and ballet trained dancer from Paris. Alumnus of the Conservatoire National. Performs with independent companies and teaches fusion workshops.", city: "Paris", styles: ["Contemporary", "Ballet"], level: "Advanced", links: ["https://vimeo.com/alexandremorel"] },
    { name: "Katarina Novak", bio: "B-girl and popping specialist from Belgrade. 2024 Balkan Battle Champion. Judges and teaches at events across Southeast Europe.", city: "Belgrade", styles: ["Breaking", "Popping"], level: "Professional", links: ["https://youtube.com/@katarina_bgirl"] },
    { name: "Marco Bianchi", bio: "Heels and commercial choreographer based in Milan. Weekly open class instructor. Choreographs for pop artists, fashion shows, and brand campaigns.", city: "Milan", styles: ["Heels", "Commercial"], level: "Advanced", links: ["https://instagram.com/marco.heels"] },
    { name: "Lena Richter", bio: "House and hip-hop freestyle dancer based in Berlin. Exploring movement culture, social dances, and the intersection of music and motion.", city: "Berlin", styles: ["House", "Hip Hop"], level: "Intermediate", links: [] },
    { name: "Ana Popescu", bio: "Young aspiring dancer from Bucharest training in contemporary and ballet. Dreams of joining a European dance company. Takes classes 5 days a week.", city: "Bucharest", styles: ["Contemporary", "Ballet"], level: "Beginner", links: [] },
    { name: "Yana Stoilova", bio: "Festival headliner and workshop instructor based in Vienna. Has performed at Eurodance Festival, Streetstar, and JD Camp. Teaching heels, hip-hop, and commercial.", city: "Vienna", styles: ["Hip Hop", "Heels", "Commercial"], level: "Professional", links: ["https://youtube.com/@yana_dance", "https://yanastoilova.com"] },
    { name: "Viktor Horvat", bio: "Popping and animation artist from Budapest. Creates mesmerizing visual performances blending dance and illusion. Regular at Popping Forever battles.", city: "Budapest", styles: ["Popping", "House"], level: "Advanced", links: ["https://vimeo.com/viktorpops"] },
    { name: "Sofia van Dijk", bio: "Contemporary dancer based in Amsterdam training intensively toward a professional career. Recently cast in an independent dance film.", city: "Amsterdam", styles: ["Contemporary"], level: "Intermediate", links: [] },
    { name: "Maria Ivanova", bio: "Breaking enthusiast, battle organizer, and community builder based in Sofia. Host of the Sofia Street Jam series and B-girl mentor.", city: "Sofia", styles: ["Breaking", "Hip Hop"], level: "Advanced", links: ["https://instagram.com/maria.breaks"] },
];

// ─── Studio profile seed data ──────────────────────────────────────────────
const STUDIO_PROFILES = [
    { name: "Movement Lifestyle", bio: "Premier urban dance studio in Sofia offering daily open classes in hip-hop, heels, and commercial. Home to some of Bulgaria's top choreographers.", city: "Sofia", styles: ["Hip Hop", "Heels", "Commercial"] },
    { name: "Millennium Dance Complex", bio: "International dance brand with a Budapest outpost. World-class choreography classes, artist training, and showcase events.", city: "Budapest", styles: ["Hip Hop", "Contemporary", "Commercial"] },
    { name: "Base Studios", bio: "Plovdiv's creative hub for contemporary, ballet, and experimental movement. Open rehearsal space, regular showcases, and artist residencies.", city: "Plovdiv", styles: ["Contemporary", "Ballet"] },
    { name: "Urban Dance Camp", bio: "Berlin-based camp and studio known for viral choreography videos. Hosts intensive programs with global guest instructors.", city: "Berlin", styles: ["Hip Hop", "House", "Breaking"] },
    { name: "Flow Academy", bio: "Vienna's home for rhythmic movement. Specializing in heels, commercial, and popping. Beginner-friendly classes and professional training tracks.", city: "Vienna", styles: ["Heels", "Commercial", "Popping"] },
];

// ─── Agency profile seed data ──────────────────────────────────────────────
const AGENCY_PROFILES = [
    { name: "Clear Talent Group", bio: "Boutique talent agency representing professional dancers across Europe. Bookings for music videos, live shows, brand campaigns, and film.", city: "Paris" },
    { name: "Bloc Agency", bio: "London-born, Europe-wide dance agency. Representing over 200 dancers for commercial, editorial, and touring work.", city: "Berlin" },
    { name: "MSA Agency", bio: "Full-service performing arts agency. Connecting dancers, choreographers, and movement directors with production companies across the continent.", city: "Milan" },
    { name: "Go 2 Talent", bio: "Talent management agency for dancers and choreographers. Focused on emerging talent from Central and Eastern Europe.", city: "Bucharest" },
    { name: "AMCK Dance", bio: "Award-winning agency for contemporary, commercial, and urban dancers. Placement in West End shows, international tours, and advertising campaigns.", city: "Madrid" },
];

// Style-aware portfolio photos per genre
const PORTFOLIO_IMAGES = {
    hiphop: [
        "https://images.unsplash.com/photo-1547153760-18fc86324498?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop",
    ],
    contemporary: [
        "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=500&h=500&fit=crop",
    ],
    ballet: [
        "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1519925610903-381054cc2a1c?w=500&h=500&fit=crop",
    ],
    breaking: [
        "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&h=500&fit=crop",
    ],
    heels: [
        "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop",
    ],
    default: [
        "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1468359601543-843bfaef291a?w=500&h=500&fit=crop",
    ],
};

function pickPortfolioImage(styles) {
    const primary = (styles[0] || "").toLowerCase().replace(/\s+/g, "");
    const pool = PORTFOLIO_IMAGES[primary] || PORTFOLIO_IMAGES.default;
    return pickRandom(pool);
}

// Helper to jitter coordinates slightly so events aren't stacked
function jitterCoord(coord) {
    const jitter = (Math.random() - 0.5) * 0.05;
    return coord + jitter;
}

// Generate a random date between now and X days in the future
function randomDateNextDays(maxDays = 180) {
    const now = new Date();
    return new Date(now.getTime() + Math.random() * maxDays * 24 * 60 * 60 * 1000);
}

async function main() {
    console.log(`Starting database seed...`);

    // 1. Clean Database (Respecting relations)
    console.log(`Clearing existing data...`);
    await prisma.message.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.portfolioItem.deleteMany();
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

    // ── Create 10 Dancers with realistic profiles ───────────────────────────
    for (let i = 0; i < DANCER_PROFILES.length; i++) {
        const profile = DANCER_PROFILES[i];
        const avatarUrl = DANCER_AVATARS[i];

        // Build style-aware portfolio items
        const portfolioItems = [
            { type: "PHOTO", url: pickPortfolioImage(profile.styles), title: "Stage Performance", description: `Performing ${profile.styles[0]} at a live event` },
            { type: "PHOTO", url: pickPortfolioImage(profile.styles), title: "Studio Session", description: "Rehearsal and class moments" },
            { type: "VIDEO", url: profile.links[0] || "https://vimeo.com/123456789", title: "Choreography Reel", description: `My latest ${profile.styles[0].toLowerCase()} choreography` },
        ];

        const user = await prisma.user.create({
            data: {
                email: `dancer${i + 1}@demo.com`,
                password: passwordHash,
                name: profile.name,
                avatarUrl,
                role: "DANCER",
                bio: profile.bio,
                city: profile.city,
                danceStyles: profile.styles,
                experienceLevel: profile.level,
                portfolioLinks: profile.links,
                loyaltyAccount: {
                    create: { points: Math.floor(Math.random() * 500) + 50 }
                },
                portfolioItems: {
                    create: portfolioItems
                }
            }
        });
        users.push(user);
    }

    // ── Create 5 Studios with full profiles ─────────────────────────────────
    for (let i = 0; i < STUDIO_PROFILES.length; i++) {
        const profile = STUDIO_PROFILES[i];
        const user = await prisma.user.create({
            data: {
                email: `studio${i + 1}@demo.com`,
                password: passwordHash,
                name: profile.name,
                avatarUrl: STUDIO_AVATARS[i],
                role: "STUDIO",
                bio: profile.bio,
                city: profile.city,
                danceStyles: profile.styles,
            }
        });
        users.push(user);
    }

    // ── Create 5 Agencies with full profiles ────────────────────────────────
    for (let i = 0; i < AGENCY_PROFILES.length; i++) {
        const profile = AGENCY_PROFILES[i];
        const user = await prisma.user.create({
            data: {
                email: `agency${i + 1}@demo.com`,
                password: passwordHash,
                name: profile.name,
                avatarUrl: AGENCY_AVATARS[i],
                role: "AGENCY",
                bio: profile.bio,
                city: profile.city,
            }
        });
        users.push(user);
    }

    // 4. Create Events
    console.log(`Creating events across Europe...`);
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

    // 5. Tag some dancers onto random events (attended/performed)
    console.log(`Tagging dancers to events...`);
    const allEvents = await prisma.event.findMany({ select: { id: true } });
    const dancers = users.filter(u => u.role === "DANCER");

    for (const dancer of dancers) {
        const shuffled = allEvents.sort(() => 0.5 - Math.random());
        const tagCount = Math.floor(Math.random() * 3) + 1;
        const eventsToTag = shuffled.slice(0, tagCount);

        await prisma.user.update({
            where: { id: dancer.id },
            data: {
                taggedEvents: {
                    connect: eventsToTag.map(e => ({ id: e.id }))
                }
            }
        });
    }

    // 6. Create some follow relationships
    console.log(`Creating follow relationships...`);
    for (const dancer of dancers) {
        // Each dancer follows 2-4 random other users
        const others = users.filter(u => u.id !== dancer.id);
        const shuffled = others.sort(() => 0.5 - Math.random());
        const followCount = Math.floor(Math.random() * 3) + 2;

        for (let i = 0; i < followCount && i < shuffled.length; i++) {
            try {
                await prisma.follow.create({
                    data: { followerId: dancer.id, followingId: shuffled[i].id }
                });
            } catch { /* skip duplicates */ }
        }
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
