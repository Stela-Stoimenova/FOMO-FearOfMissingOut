import { prisma } from "../db.js";

export async function listEvents({ q, city, from, to, minPrice, maxPrice, page = "1", limit = "10" }) {
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
            from ? { startAt: { gte: new Date(String(from)) } } : {},
            to ? { startAt: { lte: new Date(String(to)) } } : {},
            minPrice ? { priceCents: { gte: Number(minPrice) } } : {},
            maxPrice ? { priceCents: { lte: Number(maxPrice) } } : {},
        ],
    };

    const take = Math.min(Number(limit) || 10, 50);
    const skip = (Number(page) - 1) * take;

    const [items, total] = await Promise.all([
        prisma.event.findMany({
            where,
            orderBy: { startAt: "asc" },
            skip,
            take,
            include: { creator: { select: { id: true, name: true, role: true } } },
        }),
        prisma.event.count({ where }),
    ]);

    return { items, total, page: Number(page), limit: take };
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

export async function createEvent({ title, description, location, startAt, endAt, priceCents }, userId) {
    if (!title || !location || !startAt || typeof priceCents !== "number") {
        const err = new Error("title, location, startAt, priceCents are required");
        err.status = 400;
        throw err;
    }

    const event = await prisma.event.create({
        data: {
            title,
            description: description ?? null,
            location,
            startAt: new Date(startAt),
            endAt: endAt ? new Date(endAt) : null,
            priceCents,
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

    const { title, description, location, startAt, endAt, priceCents } = data;

    const updated = await prisma.event.update({
        where: { id },
        data: {
            title: title ?? existing.title,
            description: description ?? existing.description,
            location: location ?? existing.location,
            startAt: startAt ? new Date(startAt) : existing.startAt,
            endAt: endAt === null ? null : endAt ? new Date(endAt) : existing.endAt,
            priceCents: typeof priceCents === "number" ? priceCents : existing.priceCents,
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

export async function purchaseTicket(eventId, userId) {
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

    // Commission calculation
    const grossCents = event.priceCents;
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

            // Ensure loyalty account exists (create if first purchase)
            const loyaltyAccount = await tx.loyaltyAccount.upsert({
                where: { userId },
                create: { userId, points: pointsEarned },
                update: { points: { increment: pointsEarned } },
            });

            // Record the loyalty transaction
            const loyaltyTransaction = await tx.loyaltyTransaction.create({
                data: {
                    userId,
                    points: pointsEarned,
                    reason: `Ticket purchase for event #${eventId}`,
                },
            });

            return {
                ticket,
                transaction,
                loyalty: {
                    pointsEarned,
                    totalPoints: loyaltyAccount.points,
                    loyaltyTransactionId: loyaltyTransaction.id,
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
