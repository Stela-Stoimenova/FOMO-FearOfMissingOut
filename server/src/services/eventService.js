import { prisma } from "../db.js";
import { BUSINESS } from "../config/business.js";
import { createNotification } from "./notificationService.js";

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

export async function listEvents({ q, city, from, to, minPrice, maxPrice, maxCapacity, creatorId, attendeeId, page = "1", limit = "10" }) {
    const where = {
        AND: [
            q
                ? {
                    OR: [
                        { title: { contains: String(q), mode: "insensitive" } },
                        { description: { contains: String(q), mode: "insensitive" } },
                        { location: { contains: String(q), mode: "insensitive" } },
                        { creator: { name: { contains: String(q), mode: "insensitive" } } },
                    ],
                }
                : {},
            city ? { location: { contains: String(city), mode: "insensitive" } } : {},
            creatorId ? { creatorId: Number(creatorId) } : {},
            attendeeId ? { tickets: { some: { userId: Number(attendeeId), status: "VALID" } } } : {},
            from ? { startAt: { gte: new Date(String(from)) } } : {},
            to ? { startAt: { lte: new Date(String(to)) } } : {},
            minPrice ? { priceCents: { gte: Number(minPrice) } } : {},
            maxPrice ? { priceCents: { lte: Number(maxPrice) } } : {},
            maxCapacity ? { capacity: { lte: Number(maxCapacity), not: null } } : {},
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
        where: { id: { in: eventIds }, startAt: { gte: new Date() } },
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

    // Fetch only upcoming events that have coordinates
    const events = await prisma.event.findMany({
        where: {
            latitude: { not: null },
            longitude: { not: null },
            startAt: { gte: new Date() },
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

export async function createEvent({ title, description, location, startAt, endAt, priceCents, capacity, latitude, longitude, imageUrl, danceStyles }, userId) {
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
            danceStyles: Array.isArray(danceStyles) ? danceStyles : [],
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

    const { title, description, location, startAt, endAt, priceCents, capacity, latitude, longitude, imageUrl, danceStyles } = data;

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
            danceStyles: Array.isArray(danceStyles) ? danceStyles : existing.danceStyles,
        },
    });

    // Notify all current ticket holders about the change
    const attendees = await prisma.ticket.findMany({
        where: { eventId: id, status: "VALID" },
        select: { userId: true },
    });
    const uniqueAttendeeIds = [...new Set(attendees.map(t => t.userId))].filter(uid => uid !== userId);
    for (const attendeeId of uniqueAttendeeIds) {
        createNotification({
            userId: attendeeId,
            actorId: userId,
            type: "EVENT_UPDATED",
            message: `"${updated.title}" has been updated by the organiser. Check the latest details.`,
            linkPath: `/events/${id}`,
        }).catch(() => {});
    }

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

    // Collect valid ticket holders BEFORE deleting so we can notify + refund them
    const validTickets = await prisma.ticket.findMany({
        where: { eventId: id, status: "VALID" },
        select: { id: true, userId: true, priceCents: true, stripePaymentIntentId: true },
    });

    await prisma.$transaction(async (tx) => {
        const allTickets = await tx.ticket.findMany({
            where: { eventId: id },
            select: { id: true },
        });
        const ticketIds = allTickets.map(t => t.id);

        if (ticketIds.length > 0) {
            await tx.transaction.deleteMany({ where: { ticketId: { in: ticketIds } } });
            await tx.ticket.deleteMany({ where: { eventId: id } });
        }

        await tx.event.delete({ where: { id } });
    });

    // After deletion: notify each ticket holder and attempt Stripe refunds
    for (const ticket of validTickets) {
        // Best-effort Stripe refund
        if (ticket.stripePaymentIntentId && process.env.STRIPE_SECRET_KEY) {
            try {
                const { default: Stripe } = await import("stripe");
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" });
                await stripe.refunds.create({
                    payment_intent: ticket.stripePaymentIntentId,
                    reason: "requested_by_customer",
                });
            } catch {
                // Non-blocking — don't fail the whole delete
            }
        }

        createNotification({
            userId: ticket.userId,
            type: "EVENT_CANCELLED",
            message: `"${existing.title}" was cancelled by the organiser. You will receive a full refund.`,
            linkPath: "/my-tickets",
        }).catch(() => {});
    }
}

export async function purchaseTicket(eventId, userId, usePoints = false, stripePaymentIntentId = null) {
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
        const ticketsSold = await prisma.ticket.count({ where: { eventId, status: "VALID" } });

        if (ticketsSold >= event.capacity) {
            const err = new Error("Event is sold out");
            err.status = 409;
            throw err;
        }

        if (ticketsSold > event.capacity * BUSINESS.SURGE_THRESHOLD) {
            finalPrice = Math.round(event.priceCents * (1 + BUSINESS.SURGE_RATE));
            surgeApplied = true;
        }
    }

    // Block duplicate purchase if user already has a valid ticket
    const existingValidTicket = await prisma.ticket.findFirst({
        where: { userId, eventId, status: "VALID" },
    });
    if (existingValidTicket) {
        const err = new Error("You already have a ticket for this event");
        err.status = 409;
        throw err;
    }

    // Allow rebuy: check for a previously cancelled ticket to reactivate
    const cancelledTicket = await prisma.ticket.findFirst({
        where: { userId, eventId, status: "CANCELLED" },
    });

    // Determine Loyalty Discount
    let pointsToDeduct = 0;
    let discountCents = 0;

    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
        where: { userId }
    });

    if (usePoints && loyaltyAccount && loyaltyAccount.points > 0) {
        const potentialDiscountCents = loyaltyAccount.points * BUSINESS.POINT_TO_CENT;
        // Cap: points can cover at most LOYALTY_MAX_DISCOUNT_RATE (50%) of the ticket price
        const maxDiscountCents = Math.floor(finalPrice * BUSINESS.LOYALTY_MAX_DISCOUNT_RATE);
        discountCents = Math.min(potentialDiscountCents, maxDiscountCents);
        pointsToDeduct = Math.ceil(discountCents / BUSINESS.POINT_TO_CENT);
    }

    // Commission calculation (on the final discounted price)
    const grossCents = finalPrice - discountCents;
    const commissionCents = Math.round(grossCents * BUSINESS.COMMISSION_RATE);
    const netCents = grossCents - commissionCents;

    try {
        // Atomic: create/reactivate ticket + transaction + loyalty together
        const result = await prisma.$transaction(async (tx) => {
            const ticket = cancelledTicket
                ? await tx.ticket.update({
                    where: { id: cancelledTicket.id },
                    data: {
                        status: "VALID",
                        priceCents: grossCents,
                        refundAmount: null,
                        stripePaymentIntentId: stripePaymentIntentId ?? null,
                    },
                })
                : await tx.ticket.create({
                    data: {
                        userId,
                        eventId,
                        priceCents: grossCents,
                        stripePaymentIntentId: stripePaymentIntentId ?? null,
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

            // Loyalty: earn LOYALTY_EARN_RATE % of gross ticket value
            const pointsEarned = Math.round(grossCents * BUSINESS.LOYALTY_EARN_RATE);

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
                        reason: `Redeemed points for ticket #${ticket.id}`,
                        ticketId: ticket.id,
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
                        ticketId: ticket.id,
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

        // Notify event creator (studio/agency) about the ticket purchase
        const eventWithCreator = await prisma.event.findUnique({
            where: { id: eventId },
            select: { creatorId: true, title: true },
        });
        if (eventWithCreator && eventWithCreator.creatorId !== userId) {
            const buyer = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
            createNotification({
                userId: eventWithCreator.creatorId,
                actorId: userId,
                type: 'TICKET_PURCHASE',
                message: `${buyer?.name || 'A dancer'} purchased a ticket for "${eventWithCreator.title}".`,
                linkPath: `/events/${eventId}`,
            }).catch(() => {});
        }

        return result;
    } catch (err) {
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

/** Check if a specific event is in user's wishlist */
export async function isEventSaved(userId, eventId) {
    const saved = await prisma.savedEvent.findUnique({
        where: { userId_eventId: { userId, eventId } },
    });
    return { saved: !!saved };
}

/** Save an event to user's wishlist */
export async function saveEventById(userId, eventId) {
    try {
        return await prisma.savedEvent.create({
            data: { userId, eventId },
        });
    } catch (err) {
        if (String(err).includes("Unique constraint")) return { success: true }; // already saved
        throw err;
    }
}

/** Remove an event from wishlist */
export async function unsaveEventById(userId, eventId) {
    try {
        await prisma.savedEvent.delete({
            where: { userId_eventId: { userId, eventId } },
        });
        return { success: true };
    } catch (err) {
        return { success: false, error: "Not found in wishlist" };
    }
}

/** Wishlist analytics for a STUDIO/AGENCY — per-event save/conversion funnel */
export async function getWishlistAnalytics(creatorId) {
    const events = await prisma.event.findMany({
        where: { creatorId },
        select: {
            id: true,
            title: true,
            startAt: true,
            priceCents: true,
            imageUrl: true,
            savedByUsers: { select: { userId: true } },
            tickets: {
                where: { status: { in: ["VALID", "REFUNDED"] } },
                select: { userId: true },
            },
        },
        orderBy: { startAt: "desc" },
    });

    const perEvent = events.map(ev => {
        const savedUserIds = new Set(ev.savedByUsers.map(s => s.userId));
        const purchasedUserIds = new Set(ev.tickets.map(t => t.userId));
        const savedCount = savedUserIds.size;
        const savedAndPurchased = [...savedUserIds].filter(id => purchasedUserIds.has(id)).length;
        const savedNotPurchased = savedCount - savedAndPurchased;
        const conversionRate = savedCount > 0 ? Math.round((savedAndPurchased / savedCount) * 100) : null;
        return {
            id: ev.id,
            title: ev.title,
            startAt: ev.startAt,
            priceCents: ev.priceCents,
            imageUrl: ev.imageUrl,
            savedCount,
            purchasedCount: ev.tickets.length,
            savedAndPurchased,
            savedNotPurchased,
            conversionRate,
        };
    });

    const totalSaved = perEvent.reduce((s, e) => s + e.savedCount, 0);
    const totalConversions = perEvent.reduce((s, e) => s + e.savedAndPurchased, 0);
    const totalSavedNotPurchased = perEvent.reduce((s, e) => s + e.savedNotPurchased, 0);
    const overallConversionRate = totalSaved > 0 ? Math.round((totalConversions / totalSaved) * 100) : null;

    return {
        summary: { totalSaved, totalConversions, totalSavedNotPurchased, overallConversionRate },
        perEvent,
    };
}

/** List user's wishlist */
export async function getUserSavedEvents(userId) {
    const saved = await prisma.savedEvent.findMany({
        where: { userId },
        include: {
            event: {
                include: {
                    creator: { select: { id: true, name: true, role: true } },
                    _count: { select: { tickets: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return saved.map(s => s.event);
}

/**
 * Suggest dancers for an event based on overlapping dance styles.
 * Only the event creator (STUDIO/AGENCY) can call this.
 */
export async function getSuggestedDancers(eventId, requestingUserId) {
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
    if (event.creatorId !== requestingUserId) {
        const err = new Error("Only the event creator can view suggestions");
        err.status = 403;
        throw err;
    }

    // If event has no dance styles, return popular dancers by follower count
    if (!event.danceStyles || event.danceStyles.length === 0) {
        const dancers = await prisma.user.findMany({
            where: { role: "DANCER" },
            select: {
                id: true, name: true, avatarUrl: true, city: true,
                danceStyles: true, experienceLevel: true, bio: true,
                _count: { select: { followers: true } },
            },
            orderBy: { followers: { _count: "desc" } },
            take: 10,
        });
        return dancers.map(d => ({ ...d, matchScore: 0 }));
    }

    // Find dancers with at least one overlapping style
    const dancers = await prisma.user.findMany({
        where: {
            role: "DANCER",
            danceStyles: { hasSome: event.danceStyles },
        },
        select: {
            id: true, name: true, avatarUrl: true, city: true,
            danceStyles: true, experienceLevel: true, bio: true,
            _count: { select: { followers: true } },
        },
        take: 50,
    });

    // Score by overlap count, break ties by follower count
    const scored = dancers
        .map(d => {
            const overlap = d.danceStyles.filter(s => event.danceStyles.includes(s)).length;
            return { ...d, matchScore: overlap };
        })
        .sort((a, b) => b.matchScore - a.matchScore || b._count.followers - a._count.followers)
        .slice(0, 15);

    return scored;
}

/**
 * Invite any user (DANCER, STUDIO, or AGENCY) to an event.
 * Creates a notification with a link to the event so the invitee can preview it before deciding.
 */
export async function inviteToEvent(eventId, actorId, receiverId) {
    const event = await prisma.event.findUnique({
        where: { id: Number(eventId) },
        select: { id: true, title: true, creatorId: true },
    });
    if (!event) {
        const err = new Error("Event not found"); err.status = 404; throw err;
    }
    if (event.creatorId !== Number(actorId)) {
        const err = new Error("Forbidden"); err.status = 403; throw err;
    }

    const actor = await prisma.user.findUnique({
        where: { id: Number(actorId) },
        select: { name: true },
    });
    const receiver = await prisma.user.findUnique({
        where: { id: Number(receiverId) },
        select: { id: true, role: true },
    });
    if (!receiver) {
        const err = new Error("User not found"); err.status = 404; throw err;
    }

    const actorName = actor?.name || "An organizer";
    const isCollaborator = receiver.role === "STUDIO" || receiver.role === "AGENCY";
    const notifType = isCollaborator ? "EVENT_COLLAB_INVITE" : "EVENT_INVITE";
    const message = isCollaborator
        ? `${actorName} invited you to co-organize the event "${event.title}".`
        : `${actorName} invited you to perform at the event "${event.title}".`;

    await createNotification({
        userId: Number(receiverId),
        actorId: Number(actorId),
        type: notifType,
        message,
        linkPath: `/events/${event.id}`,
    });

    const existing = await prisma.message.findFirst({
        where: {
            senderId: Number(actorId),
            receiverId: Number(receiverId),
            content: message,
            createdAt: { gte: new Date(Date.now() - 1000 * 60 * 5) },
        },
    });
    if (!existing) {
        await prisma.message.create({
            data: { senderId: Number(actorId), receiverId: Number(receiverId), content: message },
        });
    }

    return { ok: true };
}

/** Cancel a ticket with time-based refund tiers. Platform keeps its commission. Loyalty points are not restored. */
export async function cancelTicketById(userId, ticketId) {
    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { event: true }
    });

    if (!ticket || ticket.userId !== userId) {
        const err = new Error("Ticket not found");
        err.status = 404;
        throw err;
    }

    if (ticket.status === "CANCELLED") {
        const err = new Error("Ticket is already cancelled");
        err.status = 400;
        throw err;
    }

    if (new Date() > new Date(ticket.event.startAt)) {
        const err = new Error("Cannot cancel an event that has already started");
        err.status = 400;
        throw err;
    }

    // Time-based refund tier
    const now = new Date();
    const eventStart = new Date(ticket.event.startAt);
    const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60);

    let refundRate;
    let refundTier;
    if (hoursUntilEvent >= 168) {          // 7+ days
        refundRate = BUSINESS.CANCEL_REFUND_RATE_EARLY;
        refundTier = "early";
    } else if (hoursUntilEvent >= 48) {    // 2–7 days
        refundRate = BUSINESS.CANCEL_REFUND_RATE_MID;
        refundTier = "mid";
    } else {                               // under 48h
        refundRate = BUSINESS.CANCEL_REFUND_RATE_LATE;
        refundTier = "late";
    }

    // Refund is calculated on what the user actually paid (priceCents already reflects the discounted amount)
    const refundAmount = Math.floor(ticket.priceCents * refundRate);

    const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.ticket.update({
            where: { id: ticketId },
            data: { status: "CANCELLED", refundAmount },
        });

        // Platform keeps its commission — do not delete the transaction record.
        // The studio simply loses this sale; funds were held by the platform pending the event.

        // Loyalty: only reverse points the user EARNED on this purchase.
        // Points that were SPENT (negative transactions) are NOT restored — they are forfeited on cancellation.
        const loyaltyTxs = await tx.loyaltyTransaction.findMany({
            where: { userId, ticketId },
        });

        if (loyaltyTxs.length > 0) {
            const pointsEarned = loyaltyTxs
                .filter(t => t.points > 0)
                .reduce((s, t) => s + t.points, 0);

            if (pointsEarned > 0) {
                const currentAccount = await tx.loyaltyAccount.findUnique({ where: { userId } });
                const actualDecrement = Math.min(pointsEarned, Math.max(0, currentAccount?.points ?? 0));
                if (actualDecrement > 0) {
                    await tx.loyaltyAccount.update({
                        where: { userId },
                        data: { points: { decrement: actualDecrement } },
                    });
                    await tx.loyaltyTransaction.create({
                        data: {
                            userId,
                            points: -actualDecrement,
                            reason: `Cancelled ticket #${ticketId} — earned points forfeited`,
                            ticketId,
                        },
                    });
                }
            }
        }

        return { success: true, refundAmount, refundTier, ticket: updated };
    });

    return result;
}

