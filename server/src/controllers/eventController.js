import {
    listEvents,
    getPopularEvents,
    getNearbyEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    purchaseTicket,
    getUserTickets,
    isEventSaved,
    saveEventById,
    unsaveEventById,
    getUserSavedEvents,
    getWishlistAnalytics,
    cancelTicketById,
    getSuggestedDancers,
    inviteToEvent,
    getPortfolioEvents,
} from "../services/eventService.js";

export async function portfolioByCreator(req, res, next) {
    try {
        const { creatorId } = req.query;
        if (!creatorId) return res.status(400).json({ error: { message: "creatorId required" } });
        const events = await getPortfolioEvents(creatorId);
        res.json(events);
    } catch (err) { next(err); }
}

export async function list(req, res, next) {
    try {
        const result = await listEvents(req.query);
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

export async function popular(req, res, next) {
    try {
        const events = await getPopularEvents();
        return res.json(events);
    } catch (err) {
        return next(err);
    }
}

export async function nearby(req, res, next) {
    try {
        const events = await getNearbyEvents(req.query);
        return res.json(events);
    } catch (err) {
        return next(err);
    }
}

export async function getById(req, res, next) {
    try {
        const id = Number(req.params.id);
        const event = await getEventById(id);
        return res.json(event);
    } catch (err) {
        return next(err);
    }
}

export async function create(req, res, next) {
    try {
        const event = await createEvent(req.body, req.user.userId);
        return res.status(201).json(event);
    } catch (err) {
        return next(err);
    }
}

export async function update(req, res, next) {
    try {
        const id = Number(req.params.id);
        const updated = await updateEvent(id, req.body, req.user.userId);
        return res.json(updated);
    } catch (err) {
        return next(err);
    }
}

export async function remove(req, res, next) {
    try {
        const id = Number(req.params.id);
        await deleteEvent(id, req.user.userId);
        return res.status(204).send();
    } catch (err) {
        return next(err);
    }
}

export async function buyTicket(req, res, next) {
    try {
        const eventId = Number(req.params.id);
        const { usePoints, stripePaymentIntentId, paymentIntentId } = req.body || {};
        const intentId = stripePaymentIntentId || paymentIntentId;
        const result = await purchaseTicket(eventId, req.user.userId, !!usePoints, intentId ?? null);
        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}

export async function myTickets(req, res, next) {
    try {
        const tickets = await getUserTickets(req.user.userId);
        return res.json(tickets);
    } catch (err) {
        return next(err);
    }
}

export async function checkSaved(req, res, next) {
    try {
        const eventId = Number(req.params.id);
        const result = await isEventSaved(req.user.userId, eventId);
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

export async function saveEvent(req, res, next) {
    try {
        const eventId = Number(req.params.id);
        const result = await saveEventById(req.user.userId, eventId);
        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}

export async function unsaveEvent(req, res, next) {
    try {
        const eventId = Number(req.params.id);
        const result = await unsaveEventById(req.user.userId, eventId);
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

export async function getSavedEvents(req, res, next) {
    try {
        const events = await getUserSavedEvents(req.user.userId);
        return res.json(events);
    } catch (err) {
        return next(err);
    }
}

export async function cancelTicket(req, res, next) {
    try {
        const ticketId = Number(req.params.id);
        const result = await cancelTicketById(req.user.userId, ticketId);
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

/** GET /api/events/me/wishlist-analytics — STUDIO/AGENCY only */
export async function wishlistAnalytics(req, res, next) {
    try {
        const data = await getWishlistAnalytics(req.user.userId);
        return res.json(data);
    } catch (err) {
        return next(err);
    }
}

/** GET /api/events/:id/suggested-dancers — STUDIO/AGENCY only */
export async function suggestDancers(req, res, next) {
    try {
        const eventId = Number(req.params.id);
        const dancers = await getSuggestedDancers(eventId, req.user.userId);
        return res.json(dancers);
    } catch (err) {
        return next(err);
    }
}

/** POST /api/events/:id/invite — STUDIO/AGENCY only, invites any user to the event */
export async function inviteParticipant(req, res, next) {
    try {
        const eventId = Number(req.params.id);
        const { receiverId } = req.body;
        if (!receiverId) {
            return res.status(400).json({ error: { message: "receiverId is required" } });
        }
        const result = await inviteToEvent(eventId, req.user.userId, receiverId);
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

