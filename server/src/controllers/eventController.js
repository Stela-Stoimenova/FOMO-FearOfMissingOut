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
} from "../services/eventService.js";

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
        const { usePoints } = req.body || {};
        const result = await purchaseTicket(eventId, req.user.userId, !!usePoints);
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
