import {
    listEvents,
    getPopularEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    purchaseTicket,
    getUserTickets,
} from "../services/eventService.js";

export async function list(req, res) {
    try {
        const result = await listEvents(req.query);
        return res.json(result);
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ message: err.message || "Failed to list events" });
    }
}

export async function popular(req, res) {
    try {
        const events = await getPopularEvents();
        return res.json(events);
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ message: err.message || "Failed to get popular events" });
    }
}

export async function getById(req, res) {
    try {
        const id = Number(req.params.id);
        const event = await getEventById(id);
        return res.json(event);
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ message: err.message || "Failed to get event" });
    }
}

export async function create(req, res) {
    try {
        const event = await createEvent(req.body, req.user.userId);
        return res.status(201).json(event);
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ message: err.message || "Create event failed" });
    }
}

export async function update(req, res) {
    try {
        const id = Number(req.params.id);
        const updated = await updateEvent(id, req.body, req.user.userId);
        return res.json(updated);
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ message: err.message || "Update event failed" });
    }
}

export async function remove(req, res) {
    try {
        const id = Number(req.params.id);
        await deleteEvent(id, req.user.userId);
        return res.status(204).send();
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ message: err.message || "Delete event failed" });
    }
}

export async function buyTicket(req, res) {
    try {
        const eventId = Number(req.params.id);
        const ticket = await purchaseTicket(eventId, req.user.userId);
        return res.status(201).json(ticket);
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ message: err.message || "Ticket purchase failed" });
    }
}

export async function myTickets(req, res) {
    try {
        const tickets = await getUserTickets(req.user.userId);
        return res.json(tickets);
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ message: err.message || "Failed to get tickets" });
    }
}
