import { prisma } from "../db.js";

function validateCoordinates(latitude, longitude) {
    if (latitude != null && (typeof latitude !== "number" || latitude < -90 || latitude > 90)) {
        const err = new Error("latitude must be a number between -90 and 90");
        err.status = 400;
        throw err;
    }
    if (longitude != null && (typeof longitude !== "number" || longitude < -180 || longitude > 180)) {
        const err = new Error("longitude must be a number between -180 and 180");
        err.status = 400;
        throw err;
    }
}

// Haversine distance in km
function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function listEvents({ q, city, from, to, minPrice, maxPrice, creatorId, page = "1", limit = "10" }) {
    const where = {
        AND: [
            q
                ? {
                    OR: [
                        { title: { contains: String(q), mode: "insensitive" } },
                        { description: { contains: String(q), mode: "insensitive" } },
                        { location: { contains: String(q), mode: "insensitive" } },
                    ],
                }
                : {},
            city ? { location: { contains: String(city), mode: "insensitive" } } : {},
            creatorId ? { creatorId: Number(creatorId) } : {},
            from ? { startAt: { gte: new Date(String(from)) } } : {},
            to ? { startAt: { lte: new Date(String(to)) } } : {},
            minPrice ? { priceCents: { gte: Number(minPrice) } } : {},
            maxPrice ? { priceCents: { lte: Number(maxPrice) } } : {},
        ],
    };

    const take = Math.min(Number(limit) || 10, 200);
    const skip = (Number(page) - 1) * take;

    const [items, total] = await Promise.all([
        prisma.event.findMany({
            where,
            orderBy: { startAt: "asc" },
            skip,
            take,
            include: {
                creator: { select: { id: true, name: true, role: true } },
                _count: { select: { tickets: true } },
            },
        }),
        prisma.event.count({ where }),
    ]);

    return { items, total, page: Number(page), limit: take };
}

export async function getPopularEvents() {
    // Aggregate ticket counts per event using groupBy
    const ticketCounts = await prisma.ticket.groupBy({
        by: ["eventId"],
        _count: { eventId: true },
        orderBy: { _count: { eventId: "desc" } },
        take: 20, // fetch extra to allow recency reranking
    });

    if (ticketCounts.length === 0) return [];

    const eventIds = ticketCounts.map((t) => t.eventId);

    // Fetch full event data for the candidates
    const events = await prisma.event.findMany({
        where: { id: { in: eventIds } },
        include: {
            creator: { select: { id: true, name: true, role: true } },
            _count: { select: { tickets: true } },
        },
    });

    // Build a map for quick lookup
    const eventMap = new Map(events.map((e) => [e.id, e]));

    // Score: ticketCount * recencyWeight
    // recencyWeight = 1 / (1 + daysSinceEvent), so upcoming/recent events rank higher
    const now = Date.now();
    const scored = ticketCounts
        .map((tc) => {
            const event = eventMap.get(tc.eventId);
            if (!event) return null;

            const daysDiff = Math.abs(event.startAt.getTime() - now) / (1000 * 60 * 60 * 24);
            const recencyWeight = 1 / (1 + daysDiff);
            const score = tc._count.eventId * recencyWeight;

            return { ...event, score, ticketsSold: tc._count.eventId };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

    return scored;
}

export async function getNearbyEvents({ lat, lng, radius = 10 }) {
    const latitude = Number(lat);
    const longitude = Number(lng);
    const maxKm = Number(radius);

    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
        const err = new Error("lat is required and must be between -90 and 90");
        err.status = 400;
        throw err;
    }
    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
        const err = new Error("lng is required and must be between -180 and 180");
        err.status = 400;
        throw err;
    }
    if (Number.isNaN(maxKm) || maxKm <= 0) {
        const err = new Error("radius must be a positive number (km)");
        err.status = 400;
        throw err;
    }

    // Fetch only events that have coordinates
    const events = await prisma.event.findMany({
        where: {
            latitude: { not: null },
            longitude: { not: null },
        },
        include: {
            creator: { select: { id: true, name: true, role: true } },
            _count: { select: { tickets: true } },
        },
    });

    // Filter by Haversine distance and sort by nearest
    const nearby = events
        .map((event) => {
            const distanceKm = haversineKm(latitude, longitude, event.latitude, event.longitude);
            return { ...event, distanceKm: Math.round(distanceKm * 100) / 100 };
        })
        .filter((e) => e.distanceKm <= maxKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);

    return nearby;
}

export async function getEventById(id) {
    if (!Number.isInteger(id)) {
        const err = new Error("Invalid id");
        err.status = 400;
        throw err;
    }

    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            creator: { select: { id: true, name: true, role: true } },
            _count: { select: { tickets: true } },
        },
    });

    if (!event) {
        const err = new Error("Event not found");
        err.status = 404;
        throw err;
    }

    return event;
}

export async function createEvent({ title, description, location, startAt, endAt, priceCents, capacity, latitude, longitude, imageUrl }, userId) {
    if (!title || !location || !startAt || typeof priceCents !== "number") {
        const err = new Error("title, location, startAt, priceCents are required");
        err.status = 400;
        throw err;
    }

    validateCoordinates(latitude, longitude);

    const event = await prisma.event.create({
        data: {
            title,
            description: description ?? null,
            location,
            startAt: new Date(startAt),
            endAt: endAt ? new Date(endAt) : null,
            priceCents,
            capacity: typeof capacity === "number" ? capacity : null,
            latitude: typeof latitude === "number" ? latitude : null,
            longitude: typeof longitude === "number" ? longitude : null,
            imageUrl: imageUrl || null,
            creatorId: userId,
        },
    });

    return event;
}

export async function updateEvent(id, data, userId) {
    if (!Number.isInteger(id)) {
        const err = new Error("Invalid id");
        err.status = 400;
        throw err;
    }

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
        const err = new Error("Event not found");
        err.status = 404;
        throw err;
    }

    if (existing.creatorId !== userId) {
        const err = new Error("You can only edit your own events");
        err.status = 403;
        throw err;
    }

    const { title, description, location, startAt, endAt, priceCents, capacity, latitude, longitude, imageUrl } = data;

    validateCoordinates(latitude, longitude);

    const updated = await prisma.event.update({
        where: { id },
        data: {
            title: title ?? existing.title,
            description: description ?? existing.description,
            location: location ?? existing.location,
            startAt: startAt ? new Date(startAt) : existing.startAt,
            endAt: endAt === null ? null : endAt ? new Date(endAt) : existing.endAt,
            priceCents: typeof priceCents === "number" ? priceCents : existing.priceCents,
            capacity: typeof capacity === "number" ? capacity : existing.capacity,
            latitude: typeof latitude === "number" ? latitude : existing.latitude,
            longitude: typeof longitude === "number" ? longitude : existing.longitude,
            imageUrl: imageUrl !== undefined ? (imageUrl || null) : existing.imageUrl,
        },
    });

    return updated;
}

export async function deleteEvent(id, userId) {
    if (!Number.isInteger(id)) {
        const err = new Error("Invalid id");
        err.status = 400;
        throw err;
    }

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
        const err = new Error("Event not found");
        err.status = 404;
        throw err;
    }

    if (existing.creatorId !== userId) {
        const err = new Error("You can only delete your own events");
        err.status = 403;
        throw err;
    }

    await prisma.event.delete({ where: { id } });
}

export async function purchaseTicket(eventId, userId, usePoints = false) {
    if (!Number.isInteger(eventId)) {
        const err = new Error("Invalid event id");
        err.status = 400;
        throw err;
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
        const err = new Error("Event not found");
        err.status = 404;
        throw err;
    }

    // Dynamic pricing: +15% when >50% of capacity is sold
    let finalPrice = event.priceCents;
    let surgeApplied = false;

    if (event.capacity != null && event.capacity > 0) {
        const ticketsSold = await prisma.ticket.count({ where: { eventId } });

        if (ticketsSold >= event.capacity) {
            const err = new Error("Event is sold out");
            err.status = 409;
            throw err;
        }

        if (ticketsSold > event.capacity * 0.5) {
            finalPrice = Math.round(event.priceCents * 1.15);
            surgeApplied = true;
        }
    }

    // Determine Loyalty Discount
    let pointsToDeduct = 0;
    let discountCents = 0;

    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
        where: { userId }
    });

    if (usePoints && loyaltyAccount && loyaltyAccount.points > 0) {
        // Exchange rate: 10 points = €1.00 (100 cents) -> 1 point = 10 cents
        const potentialDiscountCents = loyaltyAccount.points * 10;

        // Cannot discount below 0
        discountCents = Math.min(potentialDiscountCents, finalPrice);
        pointsToDeduct = Math.ceil(discountCents / 10);
    }

    // Commission calculation (on the final discounted price)
    const grossCents = finalPrice - discountCents;
    const commissionCents = Math.round(grossCents * 0.1);
    const netCents = grossCents - commissionCents;

    try {
        // Atomic: create ticket + transaction + loyalty together
        const result = await prisma.$transaction(async (tx) => {
            const ticket = await tx.ticket.create({
                data: {
                    userId,
                    eventId,
                    priceCents: grossCents,
                },
            });

            const transaction = await tx.transaction.create({
                data: {
                    ticketId: ticket.id,
                    grossCents,
                    commissionCents,
                    netCents,
                },
            });

            // Loyalty: 5% of gross ticket value
            const pointsEarned = Math.round(grossCents * 0.05);

            // Update loyalty account: deduct used, add earned
            const updatedLoyaltyAccount = await tx.loyaltyAccount.upsert({
                where: { userId },
                create: { userId, points: pointsEarned }, // If it didn't exist, they couldn't have used points
                update: { points: { increment: pointsEarned - pointsToDeduct } },
            });

            // Record loyalty deduction transaction if points used
            if (pointsToDeduct > 0) {
                await tx.loyaltyTransaction.create({
                    data: {
                        userId,
                        points: -pointsToDeduct,
                        reason: `Redeemed points for ticket #${eventId}`,
                    },
                });
            }

            // Record the loyalty earned transaction
            let loyaltyEarnedTransactionId = null;
            if (pointsEarned > 0) {
                const loyaltyTransaction = await tx.loyaltyTransaction.create({
                    data: {
                        userId,
                        points: pointsEarned,
                        reason: `Ticket purchase for event #${eventId}`,
                    },
                });
                loyaltyEarnedTransactionId = loyaltyTransaction.id;
            }

            return {
                ticket,
                transaction,
                loyalty: {
                    pointsEarned,
                    pointsDeducted: pointsToDeduct,
                    totalPoints: updatedLoyaltyAccount.points,
                    loyaltyTransactionId: loyaltyEarnedTransactionId,
                },
                pricing: {
                    basePriceCents: event.priceCents,
                    surgeApplied,
                    discountCents,
                    finalPriceCents: grossCents,
                },
            };
        });

        return result;
    } catch (err) {
        if (String(err).includes("Unique constraint")) {
            const dupErr = new Error("You already have a ticket for this event");
            dupErr.status = 409;
            throw dupErr;
        }
        throw err;
    }
}

export async function getUserTickets(userId) {
    const tickets = await prisma.ticket.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            event: { include: { creator: { select: { id: true, name: true, role: true } } } },
        },
    });

    return tickets;
}
