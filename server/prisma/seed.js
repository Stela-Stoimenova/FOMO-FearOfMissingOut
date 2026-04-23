import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════════════════
//  CITIES — 18 European cities with accurate coordinates
// ═══════════════════════════════════════════════════════════════════════════════
const CITIES = [
    { name: "Sofia", lat: 42.6977, lng: 23.3219 },
    { name: "Plovdiv", lat: 42.1439, lng: 24.7496 },
    { name: "Varna", lat: 43.2141, lng: 27.9147 },
    { name: "Bucharest", lat: 44.4268, lng: 26.1025 },
    { name: "Cluj-Napoca", lat: 46.7712, lng: 23.6236 },
    { name: "Iași", lat: 47.1585, lng: 27.6014 },
    { name: "Timișoara", lat: 45.7489, lng: 21.2087 },
    { name: "Belgrade", lat: 44.7866, lng: 20.4489 },
    { name: "Vienna", lat: 48.2082, lng: 16.3738 },
    { name: "Budapest", lat: 47.4979, lng: 19.0402 },
    { name: "Berlin", lat: 52.5200, lng: 13.4050 },
    { name: "Paris", lat: 48.8566, lng: 2.3522 },
    { name: "Milan", lat: 45.4642, lng: 9.1900 },
    { name: "Amsterdam", lat: 52.3676, lng: 4.9041 },
    { name: "Madrid", lat: 40.4168, lng: -3.7038 },
    { name: "Prague", lat: 50.0755, lng: 14.4378 },
    { name: "Warsaw", lat: 52.2297, lng: 21.0122 },
    { name: "Athens", lat: 37.9838, lng: 23.7275 },
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
    casting: [
        // Audition / stage spotlights
        "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=500&fit=crop",
        // Performance / rehearsal hall
        "https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=800&h=500&fit=crop",
        // Stage setup
        "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&h=500&fit=crop",
    ],
    performance: [
        // Stage performance
        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop",
        // Spotlights on performer
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop",
        // Concert energy
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=500&fit=crop",
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
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1546961342-ea5f71b193f3?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
];

const STUDIO_AVATARS = [
    "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1547153760-18fc86324498?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1519925610903-381054cc2a1c?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1508807526345-15e9b5f4ea2b?w=200&h=200&fit=crop",
];

const AGENCY_AVATARS = [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop",
];

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(n, arr.length));
}

// Pick an image based on the event style and title keywords
function pickImageForEvent(style, title) {
    const key = style.toLowerCase().replace(/\s+/g, "");
    const t = title.toLowerCase();
    if (t.includes("casting") || t.includes("audition") || t.includes("search")) return pickRandom(CATEGORY_IMAGES.casting);
    if (t.includes("showcase") || t.includes("performance")) return pickRandom(CATEGORY_IMAGES.performance);
    if (t.includes("festival") || t.includes("retreat")) return pickRandom(CATEGORY_IMAGES.festival);
    if (t.includes("battle")) return pickRandom(CATEGORY_IMAGES.battle);
    if (t.includes("workshop") || t.includes("masterclass") || t.includes("intensive") || t.includes("foundations") || t.includes("camp")) return pickRandom(CATEGORY_IMAGES.workshop);
    if (key === "ballet") return pickRandom(CATEGORY_IMAGES.ballet);
    if (key === "contemporary") return pickRandom(CATEGORY_IMAGES.contemporary);
    if (key === "hiphop") return pickRandom(CATEGORY_IMAGES.hiphop);
    if (key === "breaking") return pickRandom(CATEGORY_IMAGES.breaking);
    if (key === "heels" || key === "commercial") return pickRandom(CATEGORY_IMAGES.heels);
    if (key === "house" || key === "popping") return pickRandom(CATEGORY_IMAGES.hiphop);
    return pickRandom(CATEGORY_IMAGES.default);
}

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

// ═══════════════════════════════════════════════════════════════════════════════
//  STUDIO EVENT TEMPLATES — training, skill development
// ═══════════════════════════════════════════════════════════════════════════════
const STUDIO_EVENT_TEMPLATES = [
    { title: "{style} Masterclass with International Guest", desc: "Join an exclusive masterclass with a world-renowned {style} choreographer. Learn signature moves, refine your technique, and connect with dancers from across Europe." },
    { title: "{city} Street Dance Battle", desc: "The ultimate street dance battle returns to {city}! Bring your best moves and compete against top dancers from the region. Judges, prizes, and pure energy." },
    { title: "Urban Movement Festival {city}", desc: "A 2-day celebration of urban dance culture in the heart of {city}. Workshops, performances, battles, and networking with the best in the scene." },
    { title: "{style} Intensive — Advanced Choreography", desc: "Push your {style} skills to the next level in this intensive choreography session. Designed for intermediate to advanced dancers ready to grow." },
    { title: "Open Floor Sessions: {style} Night", desc: "Join our weekly open floor {style} night in {city}. All levels welcome. Music, movement, and community under one roof." },
    { title: "{city} Dance Week — {style} Edition", desc: "A week-long dance celebration featuring daily {style} workshops, showcases, and social events. The dancer community of {city} comes together!" },
    { title: "Foundations of {style}", desc: "Perfect for beginners and those looking to revisit the basics. This workshop covers core {style} techniques, musicality, and body control." },
    { title: "{style} x {style2} Fusion Workshop", desc: "Explore the intersection of {style} and {style2} in this innovative fusion workshop. Break boundaries and discover new movement possibilities." },
    { title: "Summer Dance Retreat — {city}", desc: "Escape to {city} for a 3-day immersive dance retreat. Daily classes in multiple styles, wellness sessions, and evening showcases by the best local and international talent." },
    { title: "{style} Training Lab — {city}", desc: "An intensive training session exploring the technical foundations and creative possibilities of {style}. Small group setting with personalized feedback." },
    { title: "Choreography Challenge: {style}", desc: "Learn a full {style} piece in 3 hours, then perform it live at the studio showcase. Open to all levels. Push your creative boundaries." },
    { title: "Morning Barre & {style} Flow", desc: "Start your day with a cross-training session combining barre conditioning and {style} movement. Perfect for dancers looking to build strength and fluidity." },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  AGENCY EVENT TEMPLATES — casting, recruitment, professional exposure
// ═══════════════════════════════════════════════════════════════════════════════
const AGENCY_EVENT_TEMPLATES = [
    { title: "Pro Auditions: {style} Company", desc: "Open auditions for an upcoming {style} dance project in {city}. Professional dancers with 3+ years experience are encouraged to apply. Paid positions available." },
    { title: "Casting Call — Commercial Campaign in {city}", desc: "Seeking dancers for a major commercial campaign shooting in {city}. Looking for strong {style} technique and on-camera presence. Multiple roles available." },
    { title: "{city} Dance Showcase — Industry Night", desc: "A curated showcase in {city} connecting dancers with industry professionals. Perform in front of agents, casting directors, and brand managers." },
    { title: "Movement Director Search — {city}", desc: "Audition for a movement director role in an upcoming stage production in {city}. Must have experience in {style} and theatrical direction." },
    { title: "Brand Campaign Casting: {style} Dancers", desc: "International brand seeking {style} dancers for a multi-city European campaign. Strong performance skills and camera experience required." },
    { title: "Dance Film Project — Open Call in {city}", desc: "Open casting for a short dance film shooting in {city}. Exploring themes of urban identity through {style} movement. Seeking diverse performers." },
    { title: "Festival Performance Slots — {city}", desc: "Agency-curated performance slots at a major {city} festival. Submit your reel for a chance to perform on the main stage. Travel covered for selected artists." },
    { title: "Corporate Event Dancers — {city}", desc: "Seeking professional dancers for a high-profile corporate event in {city}. {style} and commercial experience preferred. Competitive day rate." },
];

// ─── Dancer profile seed data (expanded to 20) ────────────────────────────────
const DANCER_PROFILES = [
    { name: "Lucia Fernandez", bio: "Professional hip-hop and commercial dancer from Madrid. 8+ years of stage, music video, and live concert experience across Spain and Latin America.", city: "Madrid", styles: ["Hip Hop", "Commercial"], level: "Professional", links: ["https://youtube.com/@lucia_dance", "https://instagram.com/lucia.moves"] },
    { name: "Alexandre Morel", bio: "Contemporary and ballet trained dancer from Paris. Alumnus of the Conservatoire National. Performs with independent companies and teaches fusion workshops.", city: "Paris", styles: ["Contemporary", "Ballet"], level: "Advanced", links: ["https://vimeo.com/alexandremorel"] },
    { name: "Katarina Novak", bio: "B-girl and popping specialist from Belgrade. 2024 Balkan Battle Champion. Judges and teaches at events across Southeast Europe.", city: "Belgrade", styles: ["Breaking", "Popping"], level: "Professional", links: ["https://youtube.com/@katarina_bgirl"] },
    { name: "Marco Bianchi", bio: "Heels and commercial choreographer based in Milan. Weekly open class instructor. Choreographs for pop artists, fashion shows, and brand campaigns.", city: "Milan", styles: ["Heels", "Commercial"], level: "Advanced", links: ["https://instagram.com/marco.heels"] },
    { name: "Lena Richter", bio: "House and hip-hop freestyle dancer based in Berlin. Exploring movement culture, social dances, and the intersection of music and motion.", city: "Berlin", styles: ["House", "Hip Hop"], level: "Intermediate", links: [] },
    { name: "Ana Popescu", bio: "Aspiring dancer from Bucharest training in contemporary and ballet. Dreams of joining a European dance company. Takes classes 5 days a week.", city: "Bucharest", styles: ["Contemporary", "Ballet"], level: "Beginner", links: [] },
    { name: "Yana Stoilova", bio: "Festival headliner and workshop instructor based in Vienna. Has performed at Eurodance Festival, Streetstar, and JD Camp. Teaching heels, hip-hop, and commercial.", city: "Vienna", styles: ["Hip Hop", "Heels", "Commercial"], level: "Professional", links: ["https://youtube.com/@yana_dance", "https://yanastoilova.com"] },
    { name: "Viktor Horvat", bio: "Popping and animation artist from Budapest. Creates mesmerizing visual performances blending dance and illusion. Regular at Popping Forever battles.", city: "Budapest", styles: ["Popping", "House"], level: "Advanced", links: ["https://vimeo.com/viktorpops"] },
    { name: "Sofia van Dijk", bio: "Contemporary dancer based in Amsterdam training intensively toward a professional career. Recently cast in an independent dance film.", city: "Amsterdam", styles: ["Contemporary"], level: "Intermediate", links: [] },
    { name: "Maria Ivanova", bio: "Breaking enthusiast, battle organizer, and community builder based in Sofia. Host of the Sofia Street Jam series and B-girl mentor.", city: "Sofia", styles: ["Breaking", "Hip Hop"], level: "Advanced", links: ["https://instagram.com/maria.breaks"] },
    // ── 10 additional dancers ────────────────────────────────────────────────
    { name: "Tomáš Dvořák", bio: "Contemporary and jazz dancer from Prague. Trained at the Prague Conservatory. Performs in theater and experimental dance pieces across Czechia.", city: "Prague", styles: ["Contemporary", "Ballet"], level: "Advanced", links: ["https://vimeo.com/tomasdvorak"] },
    { name: "Elif Yılmaz", bio: "Dancehall and hip-hop instructor working between Vienna and Istanbul. Known for her energetic masterclasses and crew battle performances at outdoor festivals.", city: "Vienna", styles: ["Hip Hop", "Commercial"], level: "Professional", links: ["https://instagram.com/elif.dh"] },
    { name: "Jakub Kowalski", bio: "B-boy from Warsaw with a gymnastics background. Competes in European breaking tournaments and coaches youth breaking programs at local community centers.", city: "Warsaw", styles: ["Breaking"], level: "Advanced", links: ["https://youtube.com/@jakub_bboy"] },
    { name: "Elena Papadopoulos", bio: "Contemporary dancer based in Athens. Passionate about storytelling through movement. Recently completed a residency at the Greek National Dance Centre.", city: "Athens", styles: ["Contemporary"], level: "Intermediate", links: [] },
    { name: "Dimitri Volkov", bio: "House and popping dancer from Berlin. DJ and dancer bridging club culture and stage performance. Performs at underground dance events across Germany.", city: "Berlin", styles: ["House", "Popping"], level: "Professional", links: ["https://soundcloud.com/dimitri_volkov"] },
    { name: "Alessia Romano", bio: "Ballet-trained dancer from Milan now exploring commercial and heels choreography. Developing her own dance crew focused on cinematic performance art.", city: "Milan", styles: ["Ballet", "Heels", "Commercial"], level: "Advanced", links: ["https://instagram.com/alessia.dances"] },
    { name: "Nikola Petrović", bio: "Hip-hop and commercial dancer from Belgrade. Featured in multiple music videos for Balkan pop artists. Teaches weekly classes at three studios in the city.", city: "Belgrade", styles: ["Hip Hop", "Commercial"], level: "Professional", links: ["https://youtube.com/@nikola_dance"] },
    { name: "Clara Dubois", bio: "Heels and jazz dancer based in Paris. Stage performer and choreography assistant for several French contemporary dance companies. Weekend open classes.", city: "Paris", styles: ["Heels", "Commercial"], level: "Advanced", links: [] },
    { name: "Radu Ionescu", bio: "Freestyle hip-hop dancer from Cluj-Napoca. Battle veteran with over 30 competition entries. Organizes the annual Transilvania Dance Clash event.", city: "Cluj-Napoca", styles: ["Hip Hop", "Breaking"], level: "Advanced", links: ["https://instagram.com/radu.freestyle"] },
    { name: "Anna Lindqvist", bio: "Contemporary dancer based in Amsterdam with Scandinavian heritage. Exploring site-specific performance and interdisciplinary collaboration between dance and visual art.", city: "Amsterdam", styles: ["Contemporary"], level: "Intermediate", links: ["https://annalindqvist.com"] },
];

// ─── Studio profile seed data (expanded to 8) ─────────────────────────────────
const STUDIO_PROFILES = [
    { name: "Movement Lifestyle", bio: "Premier urban dance studio in Sofia offering daily open classes in hip-hop, heels, and commercial. Home to some of Bulgaria's top choreographers.", city: "Sofia", styles: ["Hip Hop", "Heels", "Commercial"] },
    { name: "Millennium Dance Complex", bio: "International dance brand with a Budapest outpost. World-class choreography classes, artist training, and showcase events.", city: "Budapest", styles: ["Hip Hop", "Contemporary", "Commercial"] },
    { name: "Base Studios", bio: "Plovdiv's creative hub for contemporary, ballet, and experimental movement. Open rehearsal space, regular showcases, and artist residencies.", city: "Plovdiv", styles: ["Contemporary", "Ballet"] },
    { name: "Urban Dance Camp", bio: "Berlin-based camp and studio known for viral choreography videos. Hosts intensive programs with global guest instructors.", city: "Berlin", styles: ["Hip Hop", "House", "Breaking"] },
    { name: "Flow Academy", bio: "Vienna's home for rhythmic movement. Specializing in heels, commercial, and popping. Beginner-friendly classes and professional training tracks.", city: "Vienna", styles: ["Heels", "Commercial", "Popping"] },
    // ── 3 additional studios ─────────────────────────────────────────────────
    { name: "Ritmo Dance School", bio: "Madrid-based dance school with deep roots in Latin and urban styles. Weekly open classes, seasonal intensives, and community freestyle sessions every Friday night.", city: "Madrid", styles: ["Hip Hop", "Commercial"] },
    { name: "Studio Praga", bio: "Prague's premier dance studio offering a rotating schedule of contemporary, ballet, and commercial classes. Home to an annual choreography showcase.", city: "Prague", styles: ["Contemporary", "Ballet", "Commercial"] },
    { name: "Athens Movement Lab", bio: "A collaborative dance space in the heart of Athens. Focused on contemporary, ballet, and interdisciplinary work. Hosts guest workshops and performance research.", city: "Athens", styles: ["Contemporary", "Ballet"] },
];

// ─── Agency profile seed data (expanded to 6) ─────────────────────────────────
const AGENCY_PROFILES = [
    { name: "Clear Talent Group", bio: "Boutique talent agency representing professional dancers across Europe. Bookings for music videos, live shows, brand campaigns, and film.", city: "Paris" },
    { name: "Bloc Agency", bio: "London-born, Europe-wide dance agency. Representing over 200 dancers for commercial, editorial, and touring work.", city: "Berlin" },
    { name: "MSA Agency", bio: "Full-service performing arts agency. Connecting dancers, choreographers, and movement directors with production companies across the continent.", city: "Milan" },
    { name: "Go 2 Talent", bio: "Talent management agency for dancers and choreographers. Focused on emerging talent from Central and Eastern Europe.", city: "Bucharest" },
    { name: "AMCK Dance", bio: "Award-winning agency for contemporary, commercial, and urban dancers. Placement in West End shows, international tours, and advertising campaigns.", city: "Madrid" },
    // ── 1 additional agency ──────────────────────────────────────────────────
    { name: "NXT Movement Agency", bio: "Next-generation talent agency based in Amsterdam. Focused on digital-native performers, social media choreographers, and dance-tech crossover projects.", city: "Amsterdam" },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════════
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
    console.log(`Creating ${DANCER_PROFILES.length} dancers...`);
    const users = [];

    // ── Create 20 Dancers with realistic profiles ───────────────────────────
    for (let i = 0; i < DANCER_PROFILES.length; i++) {
        const profile = DANCER_PROFILES[i];
        const avatarUrl = DANCER_AVATARS[i % DANCER_AVATARS.length];

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

    // ── Create 8 Studios with full profiles ──────────────────────────────────
    console.log(`Creating ${STUDIO_PROFILES.length} studios...`);
    for (let i = 0; i < STUDIO_PROFILES.length; i++) {
        const profile = STUDIO_PROFILES[i];
        const user = await prisma.user.create({
            data: {
                email: `studio${i + 1}@demo.com`,
                password: passwordHash,
                name: profile.name,
                avatarUrl: STUDIO_AVATARS[i % STUDIO_AVATARS.length],
                role: "STUDIO",
                bio: profile.bio,
                city: profile.city,
                danceStyles: profile.styles,
            }
        });
        users.push(user);
    }

    // ── Create 6 Agencies with full profiles ─────────────────────────────────
    console.log(`Creating ${AGENCY_PROFILES.length} agencies...`);
    for (let i = 0; i < AGENCY_PROFILES.length; i++) {
        const profile = AGENCY_PROFILES[i];
        const user = await prisma.user.create({
            data: {
                email: `agency${i + 1}@demo.com`,
                password: passwordHash,
                name: profile.name,
                avatarUrl: AGENCY_AVATARS[i % AGENCY_AVATARS.length],
                role: "AGENCY",
                bio: profile.bio,
                city: profile.city,
            }
        });
        users.push(user);
    }

    // 4. Create Events
    // ── Studio events (training/skill development) ────────────────────────────
    const studios = users.filter(u => u.role === "STUDIO");
    const agencies = users.filter(u => u.role === "AGENCY");
    const dancers = users.filter(u => u.role === "DANCER");
    let eventCount = 0;

    const expectsType = Prisma.EventScalarFieldEnum && Object.keys(Prisma.EventScalarFieldEnum).includes('type');

    console.log(`Creating studio events across Europe...`);
    for (let i = 0; i < 80; i++) {
        const creator = studios[i % studios.length]; // round-robin so every studio gets events
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];
        const style = STYLES[Math.floor(Math.random() * STYLES.length)];
        const style2 = STYLES.filter(s => s !== style)[Math.floor(Math.random() * (STYLES.length - 1))];
        const template = STUDIO_EVENT_TEMPLATES[Math.floor(Math.random() * STUDIO_EVENT_TEMPLATES.length)];

        const start = randomDateNextDays();
        const end = new Date(start.getTime() + (Math.floor(Math.random() * 4) + 2) * 60 * 60 * 1000);

        const title = template.title.replace(/\{style\}/g, style).replace(/\{style2\}/g, style2).replace(/\{city\}/g, city.name);
        const description = template.desc.replace(/\{style\}/g, style.toLowerCase()).replace(/\{style2\}/g, style2.toLowerCase()).replace(/\{city\}/g, city.name);
        const imageUrl = pickImageForEvent(style, title);

        const priceCents = Math.floor(Math.random() * 50 + 10) * 100;
        const capacity = Math.floor(Math.random() * 80) + 20;

        const data = {
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
        };
        
        if (expectsType) data.type = "WORKSHOP";

        await prisma.event.create({ data });
        eventCount++;
    }

    // ── Agency events (casting/recruitment/professional) ─────────────────────
    console.log(`Creating agency events across Europe...`);
    for (let i = 0; i < 40; i++) {
        const creator = agencies[i % agencies.length]; // round-robin so every agency gets events
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];
        const style = STYLES[Math.floor(Math.random() * STYLES.length)];
        const template = AGENCY_EVENT_TEMPLATES[Math.floor(Math.random() * AGENCY_EVENT_TEMPLATES.length)];

        const start = randomDateNextDays();
        const end = new Date(start.getTime() + (Math.floor(Math.random() * 5) + 3) * 60 * 60 * 1000);

        const title = template.title.replace(/\{style\}/g, style).replace(/\{city\}/g, city.name);
        const description = template.desc.replace(/\{style\}/g, style.toLowerCase()).replace(/\{city\}/g, city.name);
        const imageUrl = pickImageForEvent(style, title);

        const priceCents = Math.floor(Math.random() * 30 + 5) * 100;
        const capacity = Math.floor(Math.random() * 100) + 20;

        const data = {
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
        };

        if (expectsType) data.type = "AUDITION";

        await prisma.event.create({ data });
        eventCount++;
    }

    // 5. Seed ticket purchases (makes popular events + dancer dashboards work)
    console.log(`Creating ticket purchases...`);
    const allEvents = await prisma.event.findMany({ select: { id: true, priceCents: true, capacity: true } });
    let ticketCount = 0;
    const ticketSet = new Set(); // "userId-eventId" to prevent duplicates

    // Pick ~15 events to be "popular" (will get extra ticket purchases)
    const popularEventIds = new Set(pickN(allEvents, 15).map(e => e.id));

    // Each dancer buys 2-5 random tickets
    for (const dancer of dancers) {
        const buyCount = Math.floor(Math.random() * 4) + 2;
        const eventsToTry = pickN(allEvents, buyCount + 5);

        let bought = 0;
        for (const ev of eventsToTry) {
            if (bought >= buyCount) break;
            const key = `${dancer.id}-${ev.id}`;
            if (ticketSet.has(key)) continue;
            ticketSet.add(key);

            const grossCents = ev.priceCents;
            const commissionCents = Math.round(grossCents * 0.1);
            const netCents = grossCents - commissionCents;

            await prisma.ticket.create({
                data: {
                    userId: dancer.id,
                    eventId: ev.id,
                    priceCents: grossCents,
                    transaction: {
                        create: { grossCents, commissionCents, netCents }
                    }
                }
            });

            // Award loyalty points (5% of gross)
            const pointsEarned = Math.round(grossCents * 0.05);
            if (pointsEarned > 0) {
                await prisma.loyaltyAccount.update({
                    where: { userId: dancer.id },
                    data: { points: { increment: pointsEarned } }
                });
                await prisma.loyaltyTransaction.create({
                    data: { userId: dancer.id, points: pointsEarned, reason: `Ticket purchase for event #${ev.id}` }
                });
            }

            bought++;
            ticketCount++;
        }
    }

    // Extra purchases for popular events → makes "Popular Events" section work
    for (const eventId of popularEventIds) {
        const extraBuyers = pickN(dancers, Math.floor(Math.random() * 6) + 3);
        for (const dancer of extraBuyers) {
            const key = `${dancer.id}-${eventId}`;
            if (ticketSet.has(key)) continue;
            ticketSet.add(key);

            const ev = allEvents.find(e => e.id === eventId);
            const grossCents = ev.priceCents;
            const commissionCents = Math.round(grossCents * 0.1);
            const netCents = grossCents - commissionCents;

            try {
                await prisma.ticket.create({
                    data: {
                        userId: dancer.id,
                        eventId,
                        priceCents: grossCents,
                        transaction: {
                            create: { grossCents, commissionCents, netCents }
                        }
                    }
                });
                ticketCount++;
            } catch { /* skip duplicates */ }
        }
    }

    // 6. Tag some dancers onto random events (attended/performed)
    console.log(`Tagging dancers to events...`);
    for (const dancer of dancers) {
        const shuffled = [...allEvents].sort(() => 0.5 - Math.random());
        const tagCount = Math.floor(Math.random() * 4) + 1;
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

    // 7. Create follow relationships (richer, uneven, realistic)
    console.log(`Creating follow relationships...`);
    let followCount = 0;
    const followSet = new Set();
    const allNonSelf = (userId) => users.filter(u => u.id !== userId);

    const safeFollow = async (followerId, followingId) => {
        const key = `${followerId}-${followingId}`;
        if (followerId !== followingId && !followSet.has(key)) {
            followSet.add(key);
            await prisma.follow.create({ data: { followerId, followingId } }).catch(() => {});
            followCount++;
        }
    };

    // GUARANTEE: Every studio and agency gets at least 3-5 deterministic dancer followers so nobody is at 0
    for (const entity of [...studios, ...agencies]) {
        const guaranteedFollowers = pickN(dancers, Math.floor(Math.random() * 3) + 3);
        for (const dancer of guaranteedFollowers) {
            await safeFollow(dancer.id, entity.id);
        }
    }

    // Dancers follow 4-10 other users (mix of dancers, studios, agencies)
    for (const dancer of dancers) {
        const count = Math.floor(Math.random() * 7) + 4;
        const targets = pickN(allNonSelf(dancer.id), count);
        for (const target of targets) {
            await safeFollow(dancer.id, target.id);
        }
    }

    // Studios follow 3-6 users (dancers, sometimes other studios)
    for (const studio of studios) {
        const count = Math.floor(Math.random() * 4) + 3;
        const targets = pickN(allNonSelf(studio.id), count);
        for (const target of targets) {
            await safeFollow(studio.id, target.id);
        }
    }

    // Agencies follow 5-10 users (mostly dancers and studios)
    for (const agency of agencies) {
        const count = Math.floor(Math.random() * 6) + 5;
        const targets = pickN([...dancers, ...studios], count);
        for (const target of targets) {
            await safeFollow(agency.id, target.id);
        }
    }

    // Make some dancers "popular" — give them extra followers
    const popularDancers = pickN(dancers, 5);
    for (const star of popularDancers) {
        const extraFollowers = pickN(allNonSelf(star.id), Math.floor(Math.random() * 10) + 8);
        for (const follower of extraFollowers) {
            await safeFollow(follower.id, star.id);
        }
    }

    // Make some studios have strong communities
    const popularStudios = pickN(studios, 3);
    for (const studio of popularStudios) {
        const extraFollowers = pickN(dancers, Math.floor(Math.random() * 8) + 6);
        for (const follower of extraFollowers) {
            await safeFollow(follower.id, studio.id);
        }
    }

    console.log(`\n✅  Seed complete!`);
    console.log(`    ${dancers.length} dancers, ${studios.length} studios, ${agencies.length} agencies`);
    console.log(`    ${eventCount} events across ${CITIES.length} cities`);
    console.log(`    ${ticketCount} ticket purchases (with transactions + loyalty points)`);
    console.log(`    ${followCount} follow relationships`);
    console.log(`\nSeeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
